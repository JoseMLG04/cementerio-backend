import postgres from "postgres";

const connectionString = process.env.SUPABASE_URL;

console.log("🔌 Conectando a base de datos...");
console.log("URL configurada:", connectionString ? "✅" : "❌");

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  socket: {
    family: 4,
  },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export default sql;
