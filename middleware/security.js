export const securityHeaders = (req, res, next) => {

  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Server", "");
  }
  
  next();
};

export const sanitizeError = (error) => {
  if (process.env.NODE_ENV === "production") {

    return { error: "Error en el servidor" };
  }
  return { error: error.message, details: error.stack };
};