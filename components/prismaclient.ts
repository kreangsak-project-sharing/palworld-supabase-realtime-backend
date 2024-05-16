import os from "os";
import si from "systeminformation";
import { apiServerMetrics, apiShowPlayers } from "./palworldapi";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

//
// systemInfoUpdate
interface SystemData {
  cpu_temp: number;
  cpu_use: number;
  ram_use: number;
}

let previousSystem: SystemData | null = null;

export const systemInfoUpdatePrisma = async () => {
  try {
    const cpuTemp = await si.cpuTemperature();
    const cpuUsage = await si.currentLoad();
    // const memInfo = await si.mem();

    // console.log(memInfo);

    const updateData: SystemData = {
      cpu_temp: cpuTemp?.max || 0,
      cpu_use: Number(cpuUsage?.currentLoad.toFixed(0)),
      // ram_use: Number(((memInfo?.used / memInfo?.total) * 100).toFixed(0)),
      ram_use: Number(ramUseinPrecen()),
    };

    // Check if previousSystem is null or if any of the values in updateData are different from previousSystem
    if (
      !previousSystem ||
      updateData.cpu_temp !== previousSystem.cpu_temp ||
      updateData.cpu_use !== previousSystem.cpu_use ||
      updateData.ram_use !== previousSystem.ram_use
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
interface PlayerData {
  name: string;
  playerId: string;
  userId: string;
  ip: string;
  ping: number;
  location_x: number;
  location_y: number;
  level: number;
}

let players: number = 0;
export const playersUpdatePrisma = async () => {
  try {
    const dataAPI: PlayerData[] | null = await apiShowPlayers();

    if (dataAPI?.length === players) {
      return;
    }

    if (
      !dataAPI ||
      (dataAPI?.length > 0 && dataAPI[dataAPI?.length - 1].playerId === "None")
    ) {
      return;
    }

    const playersData: any = await prisma.realtime_playersonline.findFirst({
      where: { id: 1 },
    });

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
    }));

    if (dataAPI?.length > playersData?.player_data.length) {
        const newPlayer = playerDataArray[playerDataArray.length - 1];

        await prisma.realtime_loginrecord.create({
          data: {
            name: newPlayer.name,
            playerId: newPlayer.playerId,
            userId: newPlayer.userId,
            ip: newPlayer.ip,
            ping: newPlayer.ping,
            location_x: newPlayer.location_x,
            location_y: newPlayer.location_y,
            level: newPlayer.level,
          },
        });

        await prisma.realtime_playersonline.update({
          where: { id: 1 },
          data: { player_data: playerDataArray },
        });
    } else if (dataAPI?.length < playersData?.player_data.length) {
      await prisma.realtime_playersonline.update({
        where: { id: 1 },
        data: { player_data: playerDataArray },
      });
    }

    players = playersData?.player_data.length;
  } catch (err) {
    console.error("Error updating players data:", err);
  }
};

// //
// // playersUpdate
// export const playersUpdatePrisma = async () => {
//   try {
//     const data = await apiShowPlayers();
//     if (
//       data.players.length > 0 &&
//       data.players[data.players.length - 1].playerId === "None"
//     ) {
//       return;
//     }

//     const playersData = await prisma.realtime_playersonline.findFirst({
//       where: { id: 1 },
//     });

//     // console.log(data.players);
//     // console.log(playersData);
//     // console.log((playersData?.player_data as any[]).length);
//     // console.log(data.players[data.players.length - 1] ?? 0);

//     if (data.players.length > 0) {
//       if (data.players.length > (playersData?.player_data as any).length) {
//         await prisma.realtime_loginrecord.create({
//           data: {
//             name: data.players[data.players.length - 1].name,
//             playerId: data.players[data.players.length - 1].playerId,
//             userId: data.players[data.players.length - 1].userId,
//             ip: data.players[data.players.length - 1].ip,
//             ping: data.players[data.players.length - 1].ping,
//             location_x: data.players[data.players.length - 1].location_x,
//             location_y: data.players[data.players.length - 1].location_y,
//             level: data.players[data.players.length - 1].level,
//           },
//         });
//       }

//       await prisma.realtime_playersonline.update({
//         where: { id: 1 },
//         data: {
//           player_data: data.players,
//         },
//       });
//     } else if (
//       data.players.length !== (playersData?.player_data as any).length
//     ) {
//       await prisma.realtime_playersonline.update({
//         where: { id: 1 },
//         data: {
//           player_data: data.players,
//         },
//       });
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };

//
// metricsUpdate
interface MetricsData {
  uptime: number;
  serverfps: number;
  maxplayernum: number;
  serverframetime: number;
  currentplayernum: number;
}

let previousMetricsData: number | null = 0; // Define previous with a specific type or null

export const metricsUpdatePrisma = async () => {
  try {
    const data: MetricsData = await apiServerMetrics();

    if (
      !previousMetricsData ||
      JSON.stringify(data?.currentplayernum) !==
        JSON.stringify(previousMetricsData)
    ) {
      await prisma.realtime_metrics.upsert({
        where: { id: 1 },
        update: data,
        create: { id: 1, ...data },
      });

      previousMetricsData = data.currentplayernum;
    }
  } catch (err) {
    console.error(err);
  }
};

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
