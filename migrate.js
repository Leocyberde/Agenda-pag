import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigrations() {
  try {
    console.log("Iniciando migrações do banco de dados...");
    
    await migrate(db, { migrationsFolder: "drizzle" });
    
    console.log("Migrações executadas com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao executar migrações:", error);
    process.exit(1);
  }
}

runMigrations();

