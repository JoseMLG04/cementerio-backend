import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Acceso denegado. Token no proporcionado.' 
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verified; 
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Token inválido o expirado' 
    });
  }
};

export const verificarTokenOpcional = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = verified;
    } catch (error) {

    }
  }
  
  next();
};
