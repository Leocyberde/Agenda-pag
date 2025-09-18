import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Define users table schema directly in the migration script
const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const db = drizzle(pool, {
  schema: { users }
});

async function runMigrations() {
  try {
    console.log("Iniciando migrações do banco de dados...");
    
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrações executadas com sucesso!");
    
    // Criar usuário admin se não existir
    console.log("Verificando se usuário admin existe...");
    const adminEmail = process.env.EMAIL_USER || "leolulu842@gmail.com";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).execute();

    if (existingAdmin.length === 0) {
      console.log("Criando usuário admin...");
      const hashedPassword = await bcrypt.hash(process.env.EMAIL_PASSWORD || "123456", 10);
      await db.insert(users).values({
        id: randomUUID(),
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
      }).execute();

      console.log("Usuário admin criado com sucesso!");
    } else {
      console.log("Usuário admin já existe.");
    }
    
    await pool.end();
    console.log("Inicialização completa!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao executar migrações:", error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();

