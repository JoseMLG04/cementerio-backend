import postgres from "postgres";

console.log("🔌 Configurando conexión a base de datos...");

// Extraer partes de la URL manualmente
const url = new URL(process.env.SUPABASE_URL);

const sql = postgres({
  host: url.hostname,
  port: url.port || 5432,
  database: url.pathname.slice(1), // Quita el "/" inicial
  username: url.username,
  password: url.password,
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

console.log("✅ Configuración de BD lista");

export default sql;
