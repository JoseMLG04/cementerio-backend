import "dotenv/config";
import cors from "cors";
import express from "express";
import usuariosRoutes from "./routes/usuariosRoutes.js";
import difuntosRoutes from "./routes/difuntosRoutes.js";
import encargadosRoutes from "./routes/encargadosRoutes.js";
import locacionesRoutes from "./routes/locacionesRoutes.js";
import panteonesRoutes from "./routes/panteonesRoutes.js";
import espaciosRoutes from "./routes/espaciosRoutes.js";
import estadosRoutes from "./routes/estadosRoutes.js";
import transaccionesRoutes from "./routes/transaccionesRoutes.js";
import reportesRoutes from "./routes/reportesRoutes.js";
import deudoresRoutes from "./routes/deudoresRoutes.js";
import movimientosRoutes from "./routes/movimientosRoutes.js";

const app = express();

const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/difuntos", difuntosRoutes);
app.use("/api/encargados", encargadosRoutes);
app.use("/api/locaciones", locacionesRoutes);
app.use("/api/panteones", panteonesRoutes);
app.use("/api/espacios", espaciosRoutes);
app.use("/api/estados", estadosRoutes);
app.use("/api/transacciones", transaccionesRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/deudores", deudoresRoutes);
app.use("/api/movimientos", movimientosRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API Cementerio Backend",
    status: "online",
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${process.env.NODE_ENV || "development"}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
});

export default app;
