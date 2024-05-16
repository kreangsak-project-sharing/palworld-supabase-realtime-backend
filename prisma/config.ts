import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tables = [
  "_prisma_migrations",
  "realtime_loginrecord",
  "realtime_metrics",
  "realtime_playersonline",
  "realtime_systeminfo",
];

//
// enableRowLevelSecurity
export async function enableRowLevelSecurity() {
  try {
    for (const table of tables) {
      const result: any[] = await prisma.$queryRaw`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = ${table}
      `;

      if (result.length > 0 && result[0].relrowsecurity === false) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
        `);
        console.log(`Row-level security enabled for table ${table}`);
      }
    }
  } catch (error) {
    console.error("Error enabling row-level security:", error);
  } finally {
    await prisma.$disconnect();
  }
}

//
// enableSupabaseRealtime
export async function enableSupabaseRealtime() {
  try {
    for (const table of tables) {
      const result: any[] = await prisma.$queryRaw`
        SELECT *
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = ${table}
      `;

      if (result.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER PUBLICATION supabase_realtime ADD TABLE ${table};
        `);
        console.log("Supabase realtime enabled.");
      }
    }
  } catch (error) {
    console.error("Supabase realtime:", error);
  } finally {
    await prisma.$disconnect();
  }
}

//
// addSelectPolicy
export async function addSelectPolicy() {
  try {
    for (const table of tables) {
      const existingPolicies: any[] = await prisma.$queryRaw`
        SELECT polname::text as polname
        FROM pg_catalog.pg_policy
        WHERE polname = ${"select_anon_" + table + "_policy"}
        AND polrelid = (SELECT oid FROM pg_catalog.pg_class WHERE relname = ${table})
      `;

      if (existingPolicies.length === 0) {
        await prisma.$executeRawUnsafe(`
          CREATE POLICY "select_anon_${table}_policy"
          ON "public"."${table}"
          AS PERMISSIVE
          FOR SELECT
          TO anon
          USING (true);
        `);

        console.log(`Select policy for table ${table} added successfully.`);
      }
    }
    console.log("Select policies for authenticated users added successfully.");
  } catch (error: any) {
    console.error("Error adding select policies:", error);
  } finally {
    await prisma.$disconnect();
  }
}

//
// exposedSchemas
export async function exposedSchemas() {
  try {
    const roles = ["anon", "authenticated", "service_role"];

    for (const role of roles) {
      const result: any[] = await prisma.$queryRaw`
        SELECT has_schema_privilege(${role}, 'public', 'USAGE') AS has_privilege
      `;

      if (!result[0]?.has_privilege) {
        await prisma.$executeRawUnsafe(
          `GRANT USAGE ON SCHEMA public TO ${role};`
        );
        await prisma.$executeRawUnsafe(
          `GRANT ALL ON ALL TABLES IN SCHEMA public TO ${role};`
        );
        console.log(`Permission granted to role ${role} for schema public.`);
      } else {
        console.log(`Role ${role} already has permission for schema public.`);
      }
    }

    console.log("Schemas exposed successfully.");
  } catch (error) {
    console.error("Error adding exposed schemas:", error);
  } finally {
    await prisma.$disconnect();
  }
}

//
// insertDataWithSpecificID
export async function insertDataWithSpecificID() {
  try {
    // Insert default values for realtime_metrics if no record with id 1 exists
    await prisma.realtime_metrics.upsert({
      where: { id: 1 },
      update: {},
      create: {
        uptime: 0,
        serverfps: 0,
        maxplayernum: 0,
        serverframetime: 0,
        currentplayernum: 0,
      },
    });

    // Insert default values for realtime_playersonline if no record with id 1 exists
    await prisma.realtime_playersonline.upsert({
      where: { id: 1 },
      update: {},
      create: {
        player_data: [],
      },
    });

    // Insert default values for realtime_systeminfo if no record with id 1 exists
    await prisma.realtime_systeminfo.upsert({
      where: { id: 1 },
      update: {},
      create: {
        cpu_temp: 0,
        cpu_use: 0,
        ram_use: 0,
      },
    });

    console.log("Data inserted successfully.");
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}
