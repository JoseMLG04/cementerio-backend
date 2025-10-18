import sql from "../config/supabase.js";

export const obtenerEncargados = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const { dpi, telefono, nombre } = req.query;

  try {
    let conditions = [];
    const params = [];
    let paramIndex = 1;

    if (dpi) {
      conditions.push(`e.enc_dpi = $${paramIndex}`);
      params.push(dpi);
      paramIndex++;
    }

    if (telefono) {
      conditions.push(`(e.enc_telefono_uno = $${paramIndex} OR e.enc_telefono_dos = $${paramIndex})`);
      params.push(telefono);
      paramIndex++;
    }

    if (nombre) {
      const nombreBusqueda = `%${nombre}%`;
      conditions.push(`(CONCAT(e.enc_primer_nombre, ' ', COALESCE(e.enc_segundo_nombre, ''), ' ', e.enc_primer_apellido, ' ', COALESCE(e.enc_segundo_apellido, '')) ILIKE $${paramIndex})`);
      params.push(nombreBusqueda);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const baseQuery = `
      SELECT 
        e.*,
        p.pan_nombre_familia
      FROM cem_encargado e
      LEFT JOIN cem_panteones p ON e.enc_panteones = p.pan_id
      ${whereClause}
      ORDER BY e.enc_id DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) 
      FROM cem_encargado e
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);

    const encargados = await sql.unsafe(baseQuery, params);
    const total = await sql.unsafe(countQuery, countParams);

    res.json({
      data: encargados,
      total: Number(total[0].count),
    });
  } catch (error) {
    console.error(error);
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
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const eliminarEncargado = async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM cem_encargado WHERE enc_id = ${id}`;
    res.json({ mensaje: "Encargado eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
