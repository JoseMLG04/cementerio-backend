import express from "express";
import {
  obtenerPanteones,
  obtenerTodosPanteones,
  buscarPanteones,           
  obtenerPanteonPorCodigo,   
  crearPanteon,
  editarPanteon,
  eliminarPanteon,
} from "../controllers/panteonesController.js";

const router = express.Router();

router.get("/buscar", buscarPanteones);
router.get("/todos", obtenerTodosPanteones);         
router.get("/codigo/:codigo", obtenerPanteonPorCodigo);

router.get("/", obtenerPanteones);
router.post("/", crearPanteon);
router.put("/:id", editarPanteon);
router.delete("/:id", eliminarPanteon);

export default router;
