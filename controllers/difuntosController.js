import sql from "../config/supabase.js";

export const obtenerDifuntos = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const { dpi, nombre, fechaDefuncionInicio, fechaDefuncionFin, fechaEntierroInicio, fechaEntierroFin } = req.query;

  try {
    let baseQuery = sql`SELECT * FROM cem_difuntos WHERE 1=1`;
    let countQuery = sql`SELECT COUNT(*) FROM cem_difuntos WHERE 1=1`;

    if (dpi) {
      baseQuery = sql`${baseQuery} AND dif_dpi = ${dpi}`;
      countQuery = sql`${countQuery} AND dif_dpi = ${dpi}`;
    }

    if (nombre && nombre.trim() !== '') {
      const nombreBusqueda = `%${nombre.trim().toLowerCase()}%`;
      baseQuery = sql`${baseQuery} AND (
        LOWER(dif_primer_nombre || ' ' || COALESCE(dif_segundo_nombre, '') || ' ' || 
        dif_primer_apellido || ' ' || COALESCE(dif_segundo_apellido, '')) 
        LIKE ${nombreBusqueda}
      )`;
      countQuery = sql`${countQuery} AND (
        LOWER(dif_primer_nombre || ' ' || COALESCE(dif_segundo_nombre, '') || ' ' || 
        dif_primer_apellido || ' ' || COALESCE(dif_segundo_apellido, '')) 
        LIKE ${nombreBusqueda}
      )`;
    }

    if (fechaDefuncionInicio && fechaDefuncionFin) {
      baseQuery = sql`${baseQuery} AND dif_fecha_defuncion BETWEEN ${fechaDefuncionInicio} AND ${fechaDefuncionFin}`;
      countQuery = sql`${countQuery} AND dif_fecha_defuncion BETWEEN ${fechaDefuncionInicio} AND ${fechaDefuncionFin}`;
    } else if (fechaDefuncionInicio) {
      baseQuery = sql`${baseQuery} AND dif_fecha_defuncion >= ${fechaDefuncionInicio}`;
      countQuery = sql`${countQuery} AND dif_fecha_defuncion >= ${fechaDefuncionInicio}`;
    } else if (fechaDefuncionFin) {
      baseQuery = sql`${baseQuery} AND dif_fecha_defuncion <= ${fechaDefuncionFin}`;
      countQuery = sql`${countQuery} AND dif_fecha_defuncion <= ${fechaDefuncionFin}`;
    }

    if (fechaEntierroInicio && fechaEntierroFin) {
      baseQuery = sql`${baseQuery} AND dif_fecha_entierro BETWEEN ${fechaEntierroInicio} AND ${fechaEntierroFin}`;
      countQuery = sql`${countQuery} AND dif_fecha_entierro BETWEEN ${fechaEntierroInicio} AND ${fechaEntierroFin}`;
    } else if (fechaEntierroInicio) {
      baseQuery = sql`${baseQuery} AND dif_fecha_entierro >= ${fechaEntierroInicio}`;
      countQuery = sql`${countQuery} AND dif_fecha_entierro >= ${fechaEntierroInicio}`;
    } else if (fechaEntierroFin) {
      baseQuery = sql`${baseQuery} AND dif_fecha_entierro <= ${fechaEntierroFin}`;
      countQuery = sql`${countQuery} AND dif_fecha_entierro <= ${fechaEntierroFin}`;
    }

    baseQuery = sql`${baseQuery} ORDER BY dif_id DESC LIMIT ${limit} OFFSET ${offset}`;

    const difuntos = await baseQuery;
    const totalResult = await countQuery;

    res.json({
      data: difuntos,
      total: Number(totalResult[0].count),
    });
  } catch (error) {
    console.error("Error en obtenerDifuntos:", error);
    res.status(500).json({ error: error.message });
  }
};
export const crearDifunto = async (req, res) => {
  const {
    dif_primer_nombre,
    dif_segundo_nombre,
    dif_primer_apellido,
    dif_segundo_apellido,
    dif_dpi,
    dif_panteon_codigo,    
    dif_numero_nicho,     
    dif_fecha_defuncion,
    dif_fecha_entierro,
  } = req.body;

  try {

    if (!dif_primer_nombre || !dif_primer_apellido) {
      return res.status(400).json({ 
        error: "Los campos primer nombre y primer apellido son obligatorios" 
      });
    }

    if (!dif_panteon_codigo) {
      return res.status(400).json({ 
        error: "Debe especificar el código del panteón" 
      });
    }

    if (!dif_numero_nicho) {
      return res.status(400).json({ 
        error: "Debe especificar el número de nicho" 
      });
    }

    const numeroNicho = parseInt(dif_numero_nicho);
    if (isNaN(numeroNicho) || numeroNicho < 1 || numeroNicho > 7) {
      return res.status(400).json({ 
        error: "El número de nicho debe estar entre 1 y 7" 
      });
    }
    
    const panteon = await sql`
      SELECT pan_id, pan_no_panteon, pan_capacidad_maxima, pan_descripcion
      FROM cem_panteones 
      WHERE pan_no_panteon = ${dif_panteon_codigo}
    `;
    
    if (panteon.length === 0) {
      return res.status(404).json({ 
        error: `No se encontró el panteón con código "${dif_panteon_codigo}". Verifique que el código sea correcto.` 
      });
    }

    const panteonId = panteon[0].pan_id;
    const capacidadMaxima = panteon[0].pan_capacidad_maxima;

    if (numeroNicho > capacidadMaxima) {
      return res.status(400).json({ 
        error: `El panteón ${dif_panteon_codigo} solo tiene capacidad para ${capacidadMaxima} nichos. El nicho ${numeroNicho} excede la capacidad.` 
      });
    }

    
    let espacio = await sql`
      SELECT esp_id, esp_ocupado 
      FROM cem_espacios 
      WHERE esp_panteon = ${panteonId} 
      AND esp_no_espacio = ${numeroNicho.toString()}
    `;

    let espacioId;

    if (espacio.length === 0) {
      
      const nuevoEspacio = await sql`
        INSERT INTO cem_espacios (
          esp_espacio, 
          esp_panteon, 
          esp_locacion, 
          esp_no_espacio,
          esp_ocupado,
          esp_valor_total,
          esp_total_pagado
        ) 
        VALUES (
          'NICHO'::TYPE_ESPACIO, 
          ${panteonId}, 
          (SELECT pan_locacion_id FROM cem_panteones WHERE pan_id = ${panteonId}),
          ${numeroNicho.toString()},
          false,
          0,
          0
        )
        RETURNING esp_id
      `;
      
      espacioId = nuevoEspacio[0].esp_id;
      
    } else {

      espacioId = espacio[0].esp_id;
      
      if (espacio[0].esp_ocupado) {
        return res.status(400).json({ 
          error: `El nicho ${numeroNicho} del panteón ${dif_panteon_codigo} ya está ocupado por otro difunto.` 
        });
      }

    }

    
    const nuevoDifunto = await sql`
      INSERT INTO cem_difuntos (
        dif_primer_nombre, 
        dif_segundo_nombre, 
        dif_primer_apellido, 
        dif_segundo_apellido,
        dif_dpi, 
        dif_espacios, 
        dif_fecha_defuncion, 
        dif_fecha_entierro
      ) VALUES (
        ${dif_primer_nombre}, 
        ${dif_segundo_nombre || null}, 
        ${dif_primer_apellido}, 
        ${dif_segundo_apellido || null},
        ${dif_dpi || null}, 
        ${espacioId}, 
        ${dif_fecha_defuncion || null}, 
        ${dif_fecha_entierro || null}
      ) 
      RETURNING *
    `;

    
    await sql`
      UPDATE cem_espacios 
      SET esp_ocupado = true 
      WHERE esp_id = ${espacioId}
    `;


    res.status(201).json({
      ...nuevoDifunto[0],
      _info: {
        panteon_codigo: dif_panteon_codigo,
        panteon_descripcion: panteon[0].pan_descripcion,
        numero_nicho: numeroNicho
      }
    });

  } catch (error) {
    console.error("Error en crearDifunto:", error);
    
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: "Ya existe un difunto con ese DPI" 
      });
    }
    
    res.status(500).json({ 
      error: "Error al crear el difunto: " + error.message 
    });
  }
};

export const editarDifunto = async (req, res) => {
  const { id } = req.params;
  const {
    dif_primer_nombre,
    dif_segundo_nombre,
    dif_primer_apellido,
    dif_segundo_apellido,
    dif_dpi,
    dif_panteon_codigo,   
    dif_numero_nicho,     
    dif_fecha_defuncion,
    dif_fecha_entierro,
  } = req.body;

  try {
    let nuevoEspacioId = null;
    
    if (dif_panteon_codigo && dif_numero_nicho) {
      const panteon = await sql`
        SELECT pan_id FROM cem_panteones 
        WHERE pan_no_panteon = ${dif_panteon_codigo}
      `;
      
      if (panteon.length === 0) {
        return res.status(404).json({ 
          error: `No se encontró el panteón "${dif_panteon_codigo}"` 
        });
      }

      const panteonId = panteon[0].pan_id;
      const numeroNicho = parseInt(dif_numero_nicho);
      let espacio = await sql`
        SELECT esp_id, esp_ocupado 
        FROM cem_espacios 
        WHERE esp_panteon = ${panteonId} 
        AND esp_no_espacio = ${numeroNicho.toString()}
      `;

      if (espacio.length === 0) {
        const nuevoEspacio = await sql`
          INSERT INTO cem_espacios (
            esp_espacio, esp_panteon, esp_locacion, 
            esp_no_espacio, esp_ocupado, esp_valor_total
          ) 
          VALUES (
            'NICHO'::TYPE_ESPACIO, 
            ${panteonId}, 
            (SELECT pan_locacion_id FROM cem_panteones WHERE pan_id = ${panteonId}),
            ${numeroNicho.toString()},
            false,
            0
          )
          RETURNING esp_id
        `;
        nuevoEspacioId = nuevoEspacio[0].esp_id;
      } else {
        if (espacio[0].esp_ocupado) {
          return res.status(400).json({ 
            error: `El nicho ${numeroNicho} del panteón ${dif_panteon_codigo} ya está ocupado` 
          });
        }
        nuevoEspacioId = espacio[0].esp_id;
      }

      const difuntoActual = await sql`
        SELECT dif_espacios FROM cem_difuntos WHERE dif_id = ${id}
      `;
      
      if (difuntoActual.length > 0 && difuntoActual[0].dif_espacios) {
        await sql`
          UPDATE cem_espacios 
          SET esp_ocupado = false 
          WHERE esp_id = ${difuntoActual[0].dif_espacios}
        `;
      }

      await sql`
        UPDATE cem_espacios 
        SET esp_ocupado = true 
        WHERE esp_id = ${nuevoEspacioId}
      `;
    }

    const actualizado = await sql`
      UPDATE cem_difuntos SET
        dif_primer_nombre = ${dif_primer_nombre},
        dif_segundo_nombre = ${dif_segundo_nombre || null},
        dif_primer_apellido = ${dif_primer_apellido},
        dif_segundo_apellido = ${dif_segundo_apellido || null},
        dif_dpi = ${dif_dpi || null},
        dif_espacios = COALESCE(${nuevoEspacioId}, dif_espacios),
        dif_fecha_defuncion = ${dif_fecha_defuncion || null},
        dif_fecha_entierro = ${dif_fecha_entierro || null},
        dif_update = now()
      WHERE dif_id = ${id}
      RETURNING *
    `;

    if (actualizado.length === 0) {
      return res.status(404).json({ error: "Difunto no encontrado" });
    }

    res.json(actualizado[0]);
  } catch (error) {
    console.error("Error en editarDifunto:", error);
    res.status(500).json({ error: error.message });
  }
};

export const eliminarDifunto = async (req, res) => {
  const { id } = req.params;
  
  try {
    const difunto = await sql`
      SELECT dif_espacios FROM cem_difuntos WHERE dif_id = ${id}
    `;

    if (difunto.length === 0) {
      return res.status(404).json({ error: "Difunto no encontrado" });
    }

    const espacioId = difunto[0].dif_espacios;

    await sql`DELETE FROM cem_difuntos WHERE dif_id = ${id}`;

    if (espacioId) {
      await sql`
        UPDATE cem_espacios 
        SET esp_ocupado = false 
        WHERE esp_id = ${espacioId}
      `;
    }

    res.json({ mensaje: "Difunto eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
