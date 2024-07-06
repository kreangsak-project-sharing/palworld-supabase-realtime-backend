import os from "os";
import si from "systeminformation";
import { apiServerMetrics, apiShowPlayers } from "./palworldapi";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// -----------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------
// Utils Function

//
// Random
function imageRandom() {
  // Generate a random number between 1 and 111
  const randomNumber = Math.floor(Math.random() * 111) + 1;

  const addpadStart =
    randomNumber < 100
      ? randomNumber.toString().padStart(3, "0")
      : randomNumber.toString();

  // Concatenate ".png" to the binary string
  const randomImageName = addpadStart + ".png";

  return randomImageName;
}

//
// getRamUsageinPrecen
const ramUseinPrecen = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  // Calculating RAM usage
  const usedMemory = totalMemory - freeMemory;
  const ramUsagePercentage = (usedMemory / totalMemory) * 100;
  return ramUsagePercentage.toFixed(0);
};

// -----------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------
// Secondary Function

//
// systemInfoUpdate
interface SystemData {
  cpu_temp: number;
  cpu_use: number;
  ram_use: number;
  swap_use: number;
}

let previousSystem: SystemData | null = null;

export const systemInfoUpdatePrisma = async () => {
  try {
    const cpuTemp = await si.cpuTemperature();
    const cpuUsage = await si.currentLoad();
    const memInfo = await si.mem();

    // console.log(memInfo);

    const updateData: SystemData = {
      cpu_temp: cpuTemp?.max || 0,
      cpu_use: Number(cpuUsage?.currentLoad.toFixed(0)),
      // ram_use: Number(((memInfo?.used / memInfo?.total) * 100).toFixed(0)),
      ram_use: Number(ramUseinPrecen()),
      swap_use: Number(
        ((memInfo?.swapused / memInfo?.swaptotal) * 100).toFixed(0)
      ),
    };

    // Check if previousSystem is null or if any of the values in updateData are different from previousSystem
    if (
      !previousSystem ||
      updateData.cpu_temp !== previousSystem.cpu_temp ||
      updateData.cpu_use !== previousSystem.cpu_use ||
      updateData.ram_use !== previousSystem.ram_use ||
      updateData.swap_use !== previousSystem.swap_use
    ) {
      await prisma.realtime_systeminfo.update({
        where: { id: 1 },
        data: updateData,
      });

      // Update previousSystem to the current data
      previousSystem = { ...updateData };
    } else {
    }
  } catch (err) {
    console.error("Error updating system info:", err);
  } finally {
    await prisma.$disconnect();
  }
};

//
// playersUpdatePrisma
interface PlayerFromAPI {
  name: string;
  playerId: string;
  userId: string;
  ip: string;
  ping: number;
  location_x: number;
  location_y: number;
  level: number;
}

type PlayerData = {
  name: string;
  playerId: string;
  userId: string;
  ip: string;
  ping: number;
  location_x: number;
  location_y: number;
  level: number;
  logintime: Date;
  imagename: string;
};

interface PlayerFromDatabase {
  id: number;
  created_at: Date;
  player_data: PlayerData[] | [];
}

let players: number = 0;
export const playersUpdatePrisma = async () => {
  try {
    const dataAPI: PlayerFromAPI[] = await apiShowPlayers();

    if (dataAPI?.length === players) {
      return;
    }

    if (
      dataAPI?.length > 0 &&
      dataAPI[dataAPI?.length - 1].playerId === "None"
    ) {
      return;
    }

    const playersData: PlayerFromDatabase | [] =
      (await prisma.realtime_playersonline.findFirst({
        where: { id: 1 },
      })) as PlayerFromDatabase;

    // console.log(playersData.player_data);

    // Transform data into the expected format
    const playerDataArray = dataAPI.map((player) => ({
      name: player.name,
      playerId: player.playerId,
      userId: player.userId,
      ip: player.ip,
      ping: player.ping,
      location_x: player.location_x,
      location_y: player.location_y,
      level: player.level,
      logintime: new Date(),
      imagename: imageRandom(),
    }));

    if (dataAPI?.length > playersData?.player_data.length) {
      const comparePlayersData = playerDataArray.filter((obj1) => {
        return !playersData.player_data.some((o) => o.userId === obj1.userId);
      });

      // comparePlayersData.sort(
      //   (a, b) => a.logintime.getTime() - b.logintime.getTime()
      // );

      // console.log(comparePlayersData);

      for (const player of comparePlayersData) {
        await prisma.realtime_loginrecord.create({
          data: {
            name: player.name,
            playerId: player.playerId,
            userId: player.userId,
            ip: player.ip,
            ping: player.ping,
            location_x: player.location_x,
            location_y: player.location_y,
            level: player.level,
          },
        });
      }

      // await Promise.all(
      //   comparePlayersData.map(async (player) => {
      //     await prisma.realtime_loginrecord.create({
      //       data: {
      //         name: player.name,
      //         playerId: player.playerId,
      //         userId: player.userId,
      //         ip: player.ip,
      //         ping: player.ping,
      //         location_x: player.location_x,
      //         location_y: player.location_y,
      //         level: player.level,
      //       },
      //     });
      //   })
      // );

      // Merge existing player data with new data
      const mergedPlayerData = [
        ...playersData.player_data,
        comparePlayersData[0],
      ];

      // console.log(mergedPlayerData);

      await prisma.realtime_playersonline.update({
        where: { id: 1 },
        data: { player_data: mergedPlayerData },
      });
    } else if (dataAPI?.length < playersData?.player_data.length) {
      const logoutPlayerData = playersData.player_data.filter((obj1) => {
        return playerDataArray.some((o) => o.userId === obj1.userId);
      });

      await prisma.realtime_playersonline.update({
        where: { id: 1 },
        data: { player_data: logoutPlayerData },
      });
    }

    players = dataAPI.length;
  } catch (err) {
    console.error("Error updating players data:", err);
  }
};

//
// metricsUpdate
interface MetricsData {
  uptime: number;
  serverfps: number;
  maxplayernum: number;
  serverframetime: number;
  currentplayernum: number;
}

export const metricsUpdatePrisma = async () => {
  try {
    const data: MetricsData = await apiServerMetrics();

    await prisma.realtime_metrics.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  } catch (err) {
    console.error(err);
  }
};

// //
// // metricsUpdate
// interface MetricsData {
//   uptime: number;
//   serverfps: number;
//   maxplayernum: number;
//   serverframetime: number;
//   currentplayernum: number;
// }

// let previousMetricsData: number | null = 0; // Define previous with a specific type or null

// export const metricsUpdatePrisma = async () => {
//   try {
//     const data: MetricsData = await apiServerMetrics();

//     if (
//       !previousMetricsData ||
//       JSON.stringify(data?.currentplayernum) !==
//         JSON.stringify(previousMetricsData)
//     ) {
//       await prisma.realtime_metrics.upsert({
//         where: { id: 1 },
//         update: data,
//         create: { id: 1, ...data },
//       });

//       previousMetricsData = data.currentplayernum;
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };

// //
// // metricsUpdate
// export const metricsUpdatePrisma = async () => {
//   try {
//     const data = await apiServerMetrics();

//     await prisma.realtime_metrics.update({
//       where: { id: 1 },
//       data: {
//         uptime: data.uptime,
//         serverfps: data.serverfps,
//         maxplayernum: data.maxplayernum,
//         serverframetime: data.serverframetime,
//         currentplayernum: data.currentplayernum,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//   }
// };
