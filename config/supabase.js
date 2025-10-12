import postgres from "postgres";

const connectionString = process.env.SUPABASE_URL;

console.log("🔌 Conectando a base de datos...");
console.log("URL configurada:", connectionString ? "✅" : "❌");
console.log("Usando pooler:", connectionString?.includes("pooler") ? "✅" : "❌");

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

console.log("✅ Configuración de BD lista");

export default sql;
