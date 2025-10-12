import postgres from "postgres";

const connectionString = process.env.SUPABASE_URL;
const sql = postgres(connectionString, {
  socket: {
    family: 4,
  },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export default sql;
