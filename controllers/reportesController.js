import sql from "../config/supabase.js";

export const resumenGeneral = async (req, res) => {
  try {
    const [espacios] = await sql`
      SELECT 
        COUNT(*) as total_espacios,
        COUNT(*) FILTER (WHERE esp_ocupado = true) as espacios_ocupados,
        COUNT(*) FILTER (WHERE esp_ocupado = false) as espacios_disponibles,
        COUNT(*) FILTER (WHERE esp_espacio = 'NICHO') as total_nichos,
        COUNT(*) FILTER (WHERE esp_espacio = 'TIERRA') as total_tierra
      FROM cem_espacios
    `;

    const [difuntos] = await sql`
      SELECT COUNT(*) as total_difuntos
      FROM cem_difuntos
    `;

    const [financiero] = await sql`
      SELECT 
        COALESCE(SUM(esp_valor_total), 0) as valor_total_espacios,
        COALESCE(SUM(esp_total_pagado), 0) as total_recaudado,
        COALESCE(SUM(esp_restante_pago), 0) as total_por_cobrar
      FROM cem_espacios
    `;

    const [transacciones] = await sql`
      SELECT 
        COUNT(*) as total_transacciones,
        COALESCE(SUM(tra_abono), 0) as suma_transacciones
      FROM cem_transacciones
    `;

    res.json({
      espacios,
      difuntos,
      financiero,
      transacciones
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const ingresosPorPeriodo = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  try {
    const ingresos = await sql`
      SELECT 
        DATE(tra_fecha_pago) as fecha,
        COUNT(*) as num_transacciones,
        SUM(tra_abono) as total_ingresos
      FROM cem_transacciones
      WHERE tra_fecha_pago BETWEEN ${fechaInicio} AND ${fechaFin}
      GROUP BY DATE(tra_fecha_pago)
      ORDER BY fecha DESC
    `;

    const [resumen] = await sql`
      SELECT 
        COUNT(*) as total_transacciones,
        COALESCE(SUM(tra_abono), 0) as total_ingresos
      FROM cem_transacciones
      WHERE tra_fecha_pago BETWEEN ${fechaInicio} AND ${fechaFin}
    `;

    res.json({
      detalle: ingresos,
      resumen
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const cuentasPorCobrar = async (req, res) => {
  try {
    const cuentas = await sql`
      SELECT 
        e.esp_id,
        e.esp_no_espacio,
        e.esp_espacio,
        l.loc_area,
        e.esp_valor_total,
        e.esp_total_pagado,
        e.esp_restante_pago,
        e.esp_cuotas_restantes,
        CASE 
          WHEN e.esp_total_pagado = 0 THEN 'Sin Pagos'
          WHEN e.esp_restante_pago > 0 THEN 'Pago Parcial'
          ELSE 'Pagado'
        END as estado_pago
      FROM cem_espacios e
      JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      WHERE e.esp_restante_pago > 0
      ORDER BY e.esp_restante_pago DESC
    `;

    const [totales] = await sql`
      SELECT 
        COUNT(*) as espacios_con_deuda,
        COALESCE(SUM(esp_restante_pago), 0) as total_por_cobrar
      FROM cem_espacios
      WHERE esp_restante_pago > 0
    `;

    res.json({
      cuentas,
      totales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const ocupacionPorArea = async (req, res) => {
  try {
    const ocupacion = await sql`
      SELECT 
        l.loc_area,
        COUNT(e.esp_id) as total_espacios,
        COUNT(e.esp_id) FILTER (WHERE e.esp_ocupado = true) as ocupados,
        COUNT(e.esp_id) FILTER (WHERE e.esp_ocupado = false) as disponibles,
        ROUND(
          (COUNT(e.esp_id) FILTER (WHERE e.esp_ocupado = true)::numeric / 
          NULLIF(COUNT(e.esp_id), 0) * 100), 2
        ) as porcentaje_ocupacion
      FROM cem_locacion l
      LEFT JOIN cem_espacios e ON l.loc_id = e.esp_locacion
      GROUP BY l.loc_id, l.loc_area
      ORDER BY l.loc_area
    `;

    res.json(ocupacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const difuntosPorPeriodo = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  try {
    const difuntos = await sql`
      SELECT 
        d.dif_id,
        d.dif_primer_nombre,
        d.dif_segundo_nombre,
        d.dif_primer_apellido,
        d.dif_segundo_apellido,
        d.dif_fecha_defuncion,
        d.dif_fecha_entierro,
        e.esp_no_espacio,
        e.esp_espacio,
        l.loc_area
      FROM cem_difuntos d
      LEFT JOIN cem_espacios e ON d.dif_espacios = e.esp_id
      LEFT JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      WHERE d.dif_fecha_entierro BETWEEN ${fechaInicio} AND ${fechaFin}
      ORDER BY d.dif_fecha_entierro DESC
    `;

    const [resumen] = await sql`
      SELECT COUNT(*) as total_difuntos
      FROM cem_difuntos
      WHERE dif_fecha_entierro BETWEEN ${fechaInicio} AND ${fechaFin}
    `;

    res.json({
      difuntos,
      resumen
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const estadoPanteones = async (req, res) => {
  try {
    const panteones = await sql`
      SELECT 
        p.pan_no_panteon,
        l.loc_area,
        p.pan_capacidad_maxima,
        COUNT(e.esp_id) as nichos_totales,
        COUNT(e.esp_id) FILTER (WHERE e.esp_ocupado = true) as nichos_ocupados,
        COUNT(e.esp_id) FILTER (WHERE e.esp_ocupado = false) as nichos_disponibles,
        p.pan_capacidad_maxima - COUNT(e.esp_id) as capacidad_restante
      FROM cem_panteones p
      LEFT JOIN cem_locacion l ON p.pan_locacion_id = l.loc_id
      LEFT JOIN cem_espacios e ON p.pan_id = e.esp_panteon
      GROUP BY p.pan_id, p.pan_no_panteon, p.pan_capacidad_maxima, l.loc_area
      ORDER BY p.pan_no_panteon
    `;

    res.json(panteones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const movimientosRecientes = async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  try {
    const movimientos = await sql`
      SELECT 
        m.mov_fecha,
        d.dif_primer_nombre,
        d.dif_segundo_nombre,
        d.dif_primer_apellido,
        d.dif_segundo_apellido,
        e.est_descripcion,
        m.mov_observaciones,
        es.esp_no_espacio,
        l.loc_area
      FROM cem_movimientos m
      JOIN cem_difuntos d ON m.mov_difuntos = d.dif_id
      JOIN cem_estados e ON m.mov_estados = e.est_id
      LEFT JOIN cem_espacios es ON d.dif_espacios = es.esp_id
      LEFT JOIN cem_locacion l ON es.esp_locacion = l.loc_id
      ORDER BY m.mov_fecha DESC, m.mov_id DESC
      LIMIT ${limit}
    `;

    res.json(movimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const espaciosDisponibles = async (req, res) => {
  try {
    const espacios = await sql`
      SELECT * FROM vw_espacios_disponibles
      ORDER BY loc_area, esp_no_espacio
    `;

    const [resumen] = await sql`
      SELECT 
        COUNT(*) as total_disponibles,
        COUNT(*) FILTER (WHERE esp_espacio = 'NICHO') as nichos_disponibles,
        COUNT(*) FILTER (WHERE esp_espacio = 'TIERRA') as tierra_disponible
      FROM vw_espacios_disponibles
    `;

    res.json({
      espacios,
      resumen
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const resumenFinancieroPorEspacio = async (req, res) => {
  try {
    const resumen = await sql`
      SELECT 
        esp_no_espacio,
        esp_espacio,
        esp_valor_total,
        esp_total_pagado,
        esp_restante_pago,
        esp_cuotas,
        esp_cuotas_restantes,
        estado_pago
      FROM vw_resumen_pagos
      ORDER BY esp_restante_pago DESC
    `;

    res.json(resumen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const topDeudores = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const top = await sql`
      SELECT 
        e.esp_no_espacio,
        e.esp_espacio,
        l.loc_area,
        e.esp_valor_total,
        e.esp_total_pagado,
        e.esp_restante_pago,
        ROUND((e.esp_total_pagado / NULLIF(e.esp_valor_total, 0) * 100), 2) as porcentaje_pagado
      FROM cem_espacios e
      JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      WHERE e.esp_restante_pago > 0
      ORDER BY e.esp_restante_pago DESC
      LIMIT ${limit}
    `;

    res.json(top);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const informacionDifunto = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await sql`
      SELECT 
        d.*,
        e.esp_no_espacio,
        e.esp_espacio,
        e.esp_valor_total,
        e.esp_total_pagado,
        e.esp_restante_pago,
        l.loc_area,
        p.pan_no_panteon,
        enc.enc_primer_nombre || ' ' || enc.enc_primer_apellido as encargado_nombre,
        enc.enc_telefono as encargado_telefono,
        enc.enc_dpi as encargado_dpi,
        enc.enc_direccion as encargado_direccion
      FROM cem_difuntos d
      LEFT JOIN cem_espacios e ON d.dif_espacios = e.esp_id
      LEFT JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      LEFT JOIN cem_panteones p ON e.esp_panteon = p.pan_id
      LEFT JOIN cem_encargados enc ON d.dif_encargados = enc.enc_id
      WHERE d.dif_id = ${id}
    `;

    if (!resultado || resultado.length === 0) {
      return res.status(404).json({ error: "Difunto no encontrado" });
    }

    const difunto = resultado[0];

    const movimientos = await sql`
      SELECT 
        m.mov_fecha,
        e.est_descripcion,
        m.mov_observaciones
      FROM cem_movimientos m
      JOIN cem_estados e ON m.mov_estados = e.est_id
      WHERE m.mov_difuntos = ${id}
      ORDER BY m.mov_fecha DESC
    `;

    const transacciones = await sql`
      SELECT 
        t.tra_fecha_pago,
        t.tra_abono,
        t.tra_no_recibo,
        t.tra_observaciones
      FROM cem_transacciones t
      JOIN cem_espacios es ON t.tra_espacios = es.esp_id
      JOIN cem_difuntos d ON d.dif_espacios = es.esp_id
      WHERE d.dif_id = ${id}
      ORDER BY t.tra_fecha_pago DESC
    `;

    res.json({
      difunto,
      movimientos,
      transacciones
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// REPORTE: BÚSQUEDA DE DIFUNTOS
// ============================================
export const buscarDifuntos = async (req, res) => {
  const { busqueda } = req.query;
  try {
    const difuntos = await sql`
      SELECT 
        d.dif_id,
        d.dif_primer_nombre,
        d.dif_segundo_nombre,
        d.dif_primer_apellido,
        d.dif_segundo_apellido,
        d.dif_fecha_defuncion,
        d.dif_fecha_entierro,
        e.esp_no_espacio,
        e.esp_espacio,
        l.loc_area
      FROM cem_difuntos d
      LEFT JOIN cem_espacios e ON d.dif_espacios = e.esp_id
      LEFT JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      WHERE 
        CONCAT(d.dif_primer_nombre, ' ', d.dif_segundo_nombre, ' ', 
               d.dif_primer_apellido, ' ', d.dif_segundo_apellido) ILIKE ${`%${busqueda}%`}
        OR d.dif_dpi ILIKE ${`%${busqueda}%`}
        OR e.esp_no_espacio ILIKE ${`%${busqueda}%`}
      ORDER BY d.dif_fecha_entierro DESC
      LIMIT 50
    `;

    res.json(difuntos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// REPORTE: CONSTANCIA DE DIFUNTO (CERTIFICADO)
// ============================================
export const constanciaDifunto = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await sql`
      SELECT 
        d.dif_primer_nombre || ' ' || 
        COALESCE(d.dif_segundo_nombre || ' ', '') || 
        d.dif_primer_apellido || ' ' || 
        COALESCE(d.dif_segundo_apellido, '') as nombre_completo,
        d.dif_dpi,
        d.dif_fecha_nacimiento,
        d.dif_fecha_defuncion,
        d.dif_fecha_entierro,
        d.dif_causa_muerte,
        e.esp_no_espacio,
        e.esp_espacio,
        l.loc_area,
        p.pan_no_panteon,
        enc.enc_primer_nombre || ' ' || enc.enc_primer_apellido as encargado,
        enc.enc_dpi as encargado_dpi,
        enc.enc_telefono as encargado_telefono
      FROM cem_difuntos d
      LEFT JOIN cem_espacios e ON d.dif_espacios = e.esp_id
      LEFT JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      LEFT JOIN cem_panteones p ON e.esp_panteon = p.pan_id
      LEFT JOIN cem_encargados enc ON d.dif_encargados = enc.enc_id
      WHERE d.dif_id = ${id}
    `;

    if (!resultado || resultado.length === 0) {
      return res.status(404).json({ error: "Difunto no encontrado" });
    }

    res.json(resultado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// REPORTE: HISTORIAL DE TRANSACCIONES POR ESPACIO
// ============================================
export const historialTransaccionesEspacio = async (req, res) => {
  const { espacioId } = req.params;
  try {
    const resultadoEspacio = await sql`
      SELECT 
        e.esp_no_espacio,
        e.esp_espacio,
        e.esp_valor_total,
        e.esp_total_pagado,
        e.esp_restante_pago,
        l.loc_area,
        d.dif_primer_nombre || ' ' || d.dif_primer_apellido as difunto
      FROM cem_espacios e
      LEFT JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      LEFT JOIN cem_difuntos d ON d.dif_espacios = e.esp_id
      WHERE e.esp_id = ${espacioId}
    `;

    if (!resultadoEspacio || resultadoEspacio.length === 0) {
      return res.status(404).json({ error: "Espacio no encontrado" });
    }

    const espacio = resultadoEspacio[0];

    const transacciones = await sql`
      SELECT 
        tra_id,
        tra_fecha_pago,
        tra_abono,
        tra_no_recibo,
        tra_observaciones
      FROM cem_transacciones
      WHERE tra_espacios = ${espacioId}
      ORDER BY tra_fecha_pago DESC
    `;

    res.json({
      espacio,
      transacciones,
      resumen: {
        total_transacciones: transacciones.length,
        total_pagado: espacio.esp_total_pagado,
        total_pendiente: espacio.esp_restante_pago
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// REPORTE: ESPACIOS CON SUS DIFUNTOS
// ============================================
export const espaciosConDifuntos = async (req, res) => {
  try {
    const espacios = await sql`
      SELECT 
        e.esp_id,
        e.esp_no_espacio,
        e.esp_espacio,
        e.esp_ocupado,
        l.loc_area,
        p.pan_no_panteon,
        d.dif_primer_nombre || ' ' || d.dif_primer_apellido as difunto_nombre,
        d.dif_fecha_entierro,
        enc.enc_primer_nombre || ' ' || enc.enc_primer_apellido as encargado,
        enc.enc_telefono,
        e.esp_valor_total,
        e.esp_total_pagado,
        e.esp_restante_pago
      FROM cem_espacios e
      LEFT JOIN cem_locacion l ON e.esp_locacion = l.loc_id
      LEFT JOIN cem_panteones p ON e.esp_panteon = p.pan_id
      LEFT JOIN cem_difuntos d ON d.dif_espacios = e.esp_id
      LEFT JOIN cem_encargados enc ON d.dif_encargados = enc.enc_id
      ORDER BY l.loc_area, e.esp_no_espacio
    `;

    const resultadoResumen = await sql`
      SELECT 
        COUNT(*) as total_espacios,
        COUNT(*) FILTER (WHERE esp_ocupado = true) as espacios_ocupados,
        COUNT(*) FILTER (WHERE esp_ocupado = false) as espacios_disponibles
      FROM cem_espacios
    `;

    const resumen = resultadoResumen[0];

    res.json({
      espacios,
      resumen
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
