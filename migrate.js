import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

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

const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("pending"),
  logoUrl: text("logo_url"),
  isOpen: boolean("is_open").notNull().default(true),
  workDays: text("work_days").notNull().default("[1,2,3,4,5,6]"),
  startTime: text("start_time").notNull().default("09:00"),
  endTime: text("end_time").notNull().default("18:00"),
  breakStartTime: text("break_start_time").default("12:00"),
  breakEndTime: text("break_end_time").default("13:00"),
  accessStartDate: timestamp("access_start_date"),
  accessEndDate: timestamp("access_end_date"),
  accessDurationDays: integer("access_duration_days").default(30),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDue: timestamp("next_payment_due"),
  monthlyFee: integer("monthly_fee").default(5000),
  paymentStatus: text("payment_status").notNull().default("pending"),
  planStatus: text("plan_status").notNull().default("free"),
  planValidity: timestamp("plan_validity"),
  noShowFeeEnabled: boolean("no_show_fee_enabled").notNull().default(false),
  noShowFeeAmount: integer("no_show_fee_amount").default(0),
  lateFeeEnabled: boolean("late_fee_enabled").notNull().default(false),
  lateFeeAmount: integer("late_fee_amount").default(0),
  lateToleranceMinutes: integer("late_tolerance_minutes").default(15),
  cancellationPolicyHours: integer("cancellation_policy_hours").default(24),
  cancellationFeeEnabled: boolean("cancellation_fee_enabled").notNull().default(false),
  cancellationFeeAmount: integer("cancellation_fee_amount").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const db = drizzle(pool, {
  schema: { users, merchants }
});

async function runMigrations() {
  try {
    console.log("=== INICIANDO MIGRAÇÕES (RENDER/REPLIT) ===");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "DEFINIDA" : "NÃO DEFINIDA");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    
    // Verificar conexão com banco
    try {
      const testQuery = await pool.query('SELECT NOW()');
      console.log("✅ Conexão com banco OK:", testQuery.rows[0]);
    } catch (error) {
      console.error("❌ Erro de conexão com banco:", error);
      throw error;
    }
    
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("✅ Migrações executadas com sucesso!");
    
    // Verificar se tabela users existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log("Tabela users existe:", tableExists.rows[0].exists);
    
    // SEPARAR CREDENCIAIS: EMAIL_USER é para envio de emails, não para admin
    // Credenciais do administrador são fixas
    const adminEmail = "leolulu842@gmail.com";
    const adminPassword = "123456";
    
    // Credenciais de email (para envio de notificações)
    const emailUser = process.env.EMAIL_USER || "gaelsalao12@gmail.com";
    const emailPassword = process.env.EMAIL_PASSWORD || "dbde barg qkyp lnvs";
    
    console.log("🔍 Verificando se usuário admin existe...");
    console.log("Admin email (para login):", adminEmail);
    console.log("Email service (para envios):", emailUser);
    
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).execute();
    console.log("Usuários encontrados com email admin:", existingAdmin.length);

    if (existingAdmin.length === 0) {
      console.log("🚀 Criando usuário admin...");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const newUser = {
        id: randomUUID(),
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
      };
      
      await db.insert(users).values(newUser).execute();
      console.log("✅ Usuário admin criado com sucesso!");
      console.log("Admin ID:", newUser.id);
      console.log("Admin Email:", newUser.email);
      
      // Verificar se foi realmente criado
      const verification = await db.select().from(users).where(eq(users.email, adminEmail)).execute();
      console.log("✅ Verificação pós-criação: usuários encontrados:", verification.length);
      
    } else {
      console.log("ℹ️ Usuário admin já existe.");
      console.log("Admin existente ID:", existingAdmin[0].id);
      console.log("Admin existente Email:", existingAdmin[0].email);
    }
    
    // Listar todos os usuários para debug
    const allUsers = await db.select({ email: users.email, role: users.role }).from(users).execute();
    console.log("📊 Total de usuários no banco:", allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`Usuario ${index + 1}: ${user.email} (${user.role})`);
    });
    
    // Listar todas as tabelas para debug
    const allTables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log("📋 Tabelas existentes:", allTables.rows.map(row => row.tablename));
    
    await pool.end();
    console.log("=== INICIALIZAÇÃO COMPLETA ===");
    console.log("🔑 Para fazer login use:");
    console.log("   Email: leolulu842@gmail.com");
    console.log("   Senha: 123456");
    console.log("📧 Para envio de emails será usado:", emailUser);
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO AO EXECUTAR MIGRAÇÕES:", error);
    console.error("Stack trace:", error.stack);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();

