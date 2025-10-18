import sql from "../config/supabase.js";

export const obtenerPanteones = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const { descripcion, locacion } = req.query;
  
  try {
    let baseQuery = `
      SELECT p.*, l.loc_area
      FROM cem_panteones p
      LEFT JOIN cem_locacion l ON p.pan_locacion_id = l.loc_id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) 
      FROM cem_panteones p
      LEFT JOIN cem_locacion l ON p.pan_locacion_id = l.loc_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (descripcion) {
      const descripcionBusqueda = `%${descripcion}%`;
      baseQuery += ` AND p.pan_descripcion ILIKE $${paramIndex}`;
      countQuery += ` AND p.pan_descripcion ILIKE $${paramIndex}`;
      params.push(descripcionBusqueda);
      paramIndex++;
    }

    if (locacion) {
      const locacionBusqueda = `%${locacion}%`;
      baseQuery += ` AND l.loc_area ILIKE $${paramIndex}`;
      countQuery += ` AND l.loc_area ILIKE $${paramIndex}`;
      params.push(locacionBusqueda);
      paramIndex++;
    }

    baseQuery += ` ORDER BY p.pan_id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const panteones = await sql.unsafe(baseQuery, params);
    const total = await sql.unsafe(countQuery, params.slice(0, -2));

    res.json({
      data: panteones,
      total: Number(total[0].count),
    });
  } catch (error) {
    console.error("Error en obtenerPanteones:", error);
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodosPanteones = async (req, res) => {
  try {
    const panteones = await sql`
      SELECT pan_id, pan_no_panteon, pan_capacidad_maxima, pan_descripcion
      FROM cem_panteones
      ORDER BY pan_no_panteon ASC
    `;
    res.json(panteones);
  } catch (error) {
    console.error("Error en obtenerTodosPanteones:", error);
    res.status(500).json({ error: error.message });
  }
};

export const buscarPanteones = async (req, res) => {
  const { busqueda } = req.query;
  
  try {
    let panteones;
    
    if (busqueda && busqueda.trim() !== '') {
      const termino = `%${busqueda.trim().toLowerCase()}%`;
      
      panteones = await sql`
        SELECT 
          p.pan_id,
          p.pan_no_panteon,
          p.pan_descripcion,
          p.pan_capacidad_maxima,
          l.loc_area,
          l.loc_descripcion as area_descripcion,
          COUNT(CASE WHEN e.esp_ocupado = true THEN 1 END)::integer as nichos_ocupados,
          (p.pan_capacidad_maxima - COUNT(CASE WHEN e.esp_ocupado = true THEN 1 END))::integer as nichos_disponibles
        FROM cem_panteones p
        JOIN cem_locacion l ON p.pan_locacion_id = l.loc_id
        LEFT JOIN cem_espacios e ON p.pan_id = e.esp_panteon
        WHERE 
          LOWER(p.pan_no_panteon) LIKE ${termino}
          OR LOWER(p.pan_descripcion) LIKE ${termino}
        GROUP BY p.pan_id, p.pan_no_panteon, p.pan_descripcion, 
                 p.pan_capacidad_maxima, l.loc_area, l.loc_descripcion
        ORDER BY p.pan_no_panteon
        LIMIT 20
      `;
    } else {
      panteones = await sql`
        SELECT 
          p.pan_id,
          p.pan_no_panteon,
          p.pan_descripcion,
          p.pan_capacidad_maxima,
          l.loc_area,
          l.loc_descripcion as area_descripcion,
          COUNT(CASE WHEN e.esp_ocupado = true THEN 1 END)::integer as nichos_ocupados,
          (p.pan_capacidad_maxima - COUNT(CASE WHEN e.esp_ocupado = true THEN 1 END))::integer as nichos_disponibles
        FROM cem_panteones p
        JOIN cem_locacion l ON p.pan_locacion_id = l.loc_id
        LEFT JOIN cem_espacios e ON p.pan_id = e.esp_panteon
        GROUP BY p.pan_id, p.pan_no_panteon, p.pan_descripcion, 
                 p.pan_capacidad_maxima, l.loc_area, l.loc_descripcion
        ORDER BY p.pan_no_panteon
        LIMIT 50
      `;
    }
    
    res.json(panteones);
  } catch (error) {
    console.error("Error en buscarPanteones:", error);
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPanteonPorCodigo = async (req, res) => {
  const { codigo } = req.params;
  
  try {
    const panteon = await sql`
      SELECT 
        p.pan_id,
        p.pan_no_panteon,
        p.pan_descripcion,
        p.pan_capacidad_maxima,
        l.loc_area,
        l.loc_descripcion as area_descripcion
      FROM cem_panteones p
      JOIN cem_locacion l ON p.pan_locacion_id = l.loc_id
      WHERE p.pan_no_panteon = ${codigo}
    `;
    
    if (panteon.length === 0) {
      return res.status(404).json({ 
        error: `No se encontró el panteón con código "${codigo}"` 
      });
    }

    const nichos = await sql`
      SELECT 
        esp_id,
        esp_no_espacio as numero_nicho,
        esp_ocupado,
        esp_valor_total,
        esp_total_pagado,
        esp_restante_pago
      FROM cem_espacios
      WHERE esp_panteon = ${panteon[0].pan_id}
      ORDER BY CAST(esp_no_espacio AS INTEGER)
    `;

    res.json({
      ...panteon[0],
      nichos: nichos
    });
  } catch (error) {
    console.error("Error en obtenerPanteonPorCodigo:", error);
    res.status(500).json({ error: error.message });
  }
};

export const crearPanteon = async (req, res) => {
  const {
    pan_no_panteon,
    pan_locacion_id,
    pan_capacidad_maxima,
    pan_descripcion,
  } = req.body;
  
  try {
    const nuevoPanteon = await sql`
      INSERT INTO cem_panteones (
        pan_no_panteon, pan_locacion_id, pan_capacidad_maxima, pan_descripcion
      ) VALUES (
        ${pan_no_panteon}, ${pan_locacion_id || null}, ${pan_capacidad_maxima || 6}, ${pan_descripcion || null}
      ) RETURNING *
    `;
    res.status(201).json(nuevoPanteon[0]);
  } catch (error) {
    console.error("Error en crearPanteon:", error);
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: "Ya existe un panteón con ese código" 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

export const editarPanteon = async (req, res) => {
  const { id } = req.params;
  const {
    pan_no_panteon,
    pan_locacion_id,
    pan_capacidad_maxima,
    pan_descripcion,
  } = req.body;
  
  try {
    const actualizado = await sql`
      UPDATE cem_panteones SET
        pan_no_panteon = ${pan_no_panteon},
        pan_locacion_id = ${pan_locacion_id || null},
        pan_capacidad_maxima = ${pan_capacidad_maxima || 6},
        pan_descripcion = ${pan_descripcion || null},
        pan_update = now()
      WHERE pan_id = ${id}
      RETURNING *
    `;
    
    if (actualizado.length === 0) {
      return res.status(404).json({ error: "Panteón no encontrado" });
    }
    
    res.json(actualizado[0]);
  } catch (error) {
    console.error("Error en editarPanteon:", error);
    res.status(500).json({ error: error.message });
  }
};

export const eliminarPanteon = async (req, res) => {
  const { id } = req.params;
  
  try {
    const espacios = await sql`
      SELECT COUNT(*) FROM cem_espacios WHERE esp_panteon = ${id}
    `;

    if (Number(espacios[0].count) > 0) {
      return res.status(400).json({ 
        error: "No se puede eliminar el panteón porque tiene espacios asociados" 
      });
    }

    await sql`DELETE FROM cem_panteones WHERE pan_id = ${id}`;
    res.json({ mensaje: "Panteón eliminado" });
  } catch (error) {
    console.error("Error en eliminarPanteon:", error);
    res.status(500).json({ error: error.message });
  }
};
