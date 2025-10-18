import express from "express";
import {
  resumenGeneral,
  ingresosPorPeriodo,
  cuentasPorCobrar,
  ocupacionPorArea,
  difuntosPorPeriodo,
  estadoPanteones,
  movimientosRecientes,
  espaciosDisponibles,
  resumenFinancieroPorEspacio,
  topDeudores,
  informacionDifunto,
  buscarDifuntos,
  constanciaDifunto,
  historialTransaccionesEspacio,
  espaciosConDifuntos,
} from "../controllers/reportesController.js";

const router = express.Router();

router.get("/resumen-general", resumenGeneral);
router.get("/ingresos-periodo", ingresosPorPeriodo);
router.get("/cuentas-cobrar", cuentasPorCobrar);
router.get("/ocupacion-area", ocupacionPorArea);
router.get("/difuntos-periodo", difuntosPorPeriodo);
router.get("/estado-panteones", estadoPanteones);
router.get("/movimientos-recientes", movimientosRecientes);
router.get("/espacios-disponibles", espaciosDisponibles);
router.get("/resumen-financiero", resumenFinancieroPorEspacio);
router.get("/top-deudores", topDeudores);


router.get("/difunto/:id", informacionDifunto);
router.get("/buscar-difuntos", buscarDifuntos);
router.get("/constancia-difunto/:id", constanciaDifunto);
router.get("/historial-espacio/:espacioId", historialTransaccionesEspacio);
router.get("/espacios-difuntos", espaciosConDifuntos);

export default router;
