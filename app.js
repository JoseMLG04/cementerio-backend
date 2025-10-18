import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { verificarToken } from "./middleware/auth.js";
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
const isProduction = process.env.NODE_ENV === "production";


const requiredEnvVars = ["SUPABASE_URL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error("❌ Faltan variables de entorno:", missingEnvVars);
  process.exit(1);
}


app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 1000 : 5000,
  message: { error: "Demasiadas peticiones, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);


const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.disable("x-powered-by");


const rutasPublicas = [
  '/health',
  '/api/usuarios/login'
];

app.use((req, res, next) => {

  if (rutasPublicas.includes(req.path)) {
    return next();
  }
  

  if (req.path === '/') {
    return next();
  }
  

  if (req.path.startsWith('/api/')) {
    return verificarToken(req, res, next);
  }
  
  next();
});


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
  if (isProduction) {
    res.json({ status: "ok" });
  } else {
    res.json({
      message: "API Cementerio Backend",
      status: "online",
      version: "1.0.0"
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada"
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
 
  if (isProduction) {
    res.status(err.status || 500).json({
      error: "Error en el servidor"
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
  console.log(`🌐 CORS: ${corsOptions.origin}`);
  console.log(`⏰ Inicio: ${new Date().toISOString()}`);
});

export default app;