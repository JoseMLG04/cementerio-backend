import sql from "../config/supabase.js";

export const obtenerEncargados = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const { dpi, telefono, nombre } = req.query;

  try {
    let encargados;
    let totalResult;

    if (!dpi && !telefono && !nombre) {
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`SELECT COUNT(*) FROM cem_encargado`;
    } 

    else if (dpi && !telefono && !nombre) {
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE e.enc_dpi = ${dpi}
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`SELECT COUNT(*) FROM cem_encargado WHERE enc_dpi = ${dpi}`;
    } 

    else if (telefono && !dpi && !nombre) {
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE (e.enc_telefono_uno = ${telefono} OR e.enc_telefono_dos = ${telefono})
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) FROM cem_encargado 
        WHERE (enc_telefono_uno = ${telefono} OR enc_telefono_dos = ${telefono})
      `;
    } 

    else if (nombre && !dpi && !telefono) {
      const nombreBusqueda = `%${nombre}%`;
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE CONCAT(e.enc_primer_nombre, ' ', COALESCE(e.enc_segundo_nombre, ''), ' ', 
                     e.enc_primer_apellido, ' ', COALESCE(e.enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) FROM cem_encargado 
        WHERE CONCAT(enc_primer_nombre, ' ', COALESCE(enc_segundo_nombre, ''), ' ', 
                     enc_primer_apellido, ' ', COALESCE(enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
      `;
    } 

    else if (dpi && telefono && !nombre) {
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE e.enc_dpi = ${dpi}
          AND (e.enc_telefono_uno = ${telefono} OR e.enc_telefono_dos = ${telefono})
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) FROM cem_encargado 
        WHERE enc_dpi = ${dpi}
          AND (enc_telefono_uno = ${telefono} OR enc_telefono_dos = ${telefono})
      `;
    } 

    else if (dpi && nombre && !telefono) {
      const nombreBusqueda = `%${nombre}%`;
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE e.enc_dpi = ${dpi}
          AND CONCAT(e.enc_primer_nombre, ' ', COALESCE(e.enc_segundo_nombre, ''), ' ', 
                     e.enc_primer_apellido, ' ', COALESCE(e.enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) FROM cem_encargado 
        WHERE enc_dpi = ${dpi}
          AND CONCAT(enc_primer_nombre, ' ', COALESCE(enc_segundo_nombre, ''), ' ', 
                     enc_primer_apellido, ' ', COALESCE(enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
      `;
    } 

    else if (telefono && nombre && !dpi) {
      const nombreBusqueda = `%${nombre}%`;
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE (e.enc_telefono_uno = ${telefono} OR e.enc_telefono_dos = ${telefono})
          AND CONCAT(e.enc_primer_nombre, ' ', COALESCE(e.enc_segundo_nombre, ''), ' ', 
                     e.enc_primer_apellido, ' ', COALESCE(e.enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) FROM cem_encargado 
        WHERE (enc_telefono_uno = ${telefono} OR enc_telefono_dos = ${telefono})
          AND CONCAT(enc_primer_nombre, ' ', COALESCE(enc_segundo_nombre, ''), ' ', 
                     enc_primer_apellido, ' ', COALESCE(enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
      `;
    } 

    else {
      const nombreBusqueda = `%${nombre}%`;
      encargados = await sql`
        SELECT 
          e.*,
          p.pan_descripcion
        FROM cem_encargado e
        LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
        WHERE e.enc_dpi = ${dpi}
          AND (e.enc_telefono_uno = ${telefono} OR e.enc_telefono_dos = ${telefono})
          AND CONCAT(e.enc_primer_nombre, ' ', COALESCE(e.enc_segundo_nombre, ''), ' ', 
                     e.enc_primer_apellido, ' ', COALESCE(e.enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
        ORDER BY e.enc_id DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) FROM cem_encargado 
        WHERE enc_dpi = ${dpi}
          AND (enc_telefono_uno = ${telefono} OR enc_telefono_dos = ${telefono})
          AND CONCAT(enc_primer_nombre, ' ', COALESCE(enc_segundo_nombre, ''), ' ', 
                     enc_primer_apellido, ' ', COALESCE(enc_segundo_apellido, '')) ILIKE ${nombreBusqueda}
      `;
    }

    res.json({
      data: encargados,
      total: Number(totalResult[0].count),
    });
  } catch (error) {
    console.error("Error en obtenerEncargados:", error);
    res.status(500).json({ error: error.message });
  }
};

export const crearEncargado = async (req, res) => {
  const {
    enc_primer_nombre,
    enc_segundo_nombre,
    enc_primer_apellido,
    enc_segundo_apellido,
    enc_telefono_uno,
    enc_telefono_dos,
    enc_dpi,
    enc_direccion,
    enc_panteones,
  } = req.body;
  try {
    const nuevoEncargado = await sql`
      INSERT INTO cem_encargado (
        enc_primer_nombre, enc_segundo_nombre, enc_primer_apellido, enc_segundo_apellido,
        enc_telefono_uno, enc_telefono_dos, enc_dpi, enc_direccion, enc_panteones
      ) VALUES (
        ${enc_primer_nombre}, ${enc_segundo_nombre}, ${enc_primer_apellido}, ${enc_segundo_apellido},
        ${enc_telefono_uno}, ${enc_telefono_dos}, ${enc_dpi}, ${enc_direccion}, ${enc_panteones}
      ) RETURNING *`;
    res.status(201).json(nuevoEncargado[0]);
  } catch (error) {
    console.error("Error en crearEncargado:", error);
    res.status(500).json({ error: error.message });
  }
};

export const editarEncargado = async (req, res) => {
  const { id } = req.params;
  const {
    enc_primer_nombre,
    enc_segundo_nombre,
    enc_primer_apellido,
    enc_segundo_apellido,
    enc_telefono_uno,
    enc_telefono_dos,
    enc_dpi,
    enc_direccion,
    enc_panteones,
  } = req.body;
  try {
    const actualizado = await sql`
      UPDATE cem_encargado SET
        enc_primer_nombre = ${enc_primer_nombre},
        enc_segundo_nombre = ${enc_segundo_nombre},
        enc_primer_apellido = ${enc_primer_apellido},
        enc_segundo_apellido = ${enc_segundo_apellido},
        enc_telefono_uno = ${enc_telefono_uno},
        enc_telefono_dos = ${enc_telefono_dos},
        enc_dpi = ${enc_dpi},
        enc_direccion = ${enc_direccion},
        enc_panteones = ${enc_panteones},
        enc_update = now()
      WHERE enc_id = ${id}
      RETURNING *`;
    res.json(actualizado[0]);
  } catch (error) {
    console.error("Error en editarEncargado:", error);
    res.status(500).json({ error: error.message });
  }
};

export const eliminarEncargado = async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM cem_encargado WHERE enc_id = ${id}`;
    res.json({ mensaje: "Encargado eliminado" });
  } catch (error) {
    console.error("Error en eliminarEncargado:", error);
    res.status(500).json({ error: error.message });
  }
};
