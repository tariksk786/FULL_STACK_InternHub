/**
 * Centralized Secure Error Handling Middleware
 * Prevents disclosure of stack traces, database paths, and system internals.
 */

export function errorHandler(err, req, res, next) {
  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received.'
    });
  }

  // Handle Payload Too Large (e.g. > 100kb)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Maximum allowed size is 100KB.'
    });
  }

  // Handle SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      success: false,
      message: 'A conflicting record already exists in the database.'
    });
  }

  // Log error message internally without leaking personal data or credentials
  console.error('[Application Error]:', {
    message: err.message,
    status: err.status || 500,
    timestamp: new Date().toISOString()
  });

  // Return a generic safe response
  const statusCode = err.status && Number.isInteger(err.status) && err.status >= 400 && err.status < 600
    ? err.status
    : 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An unexpected server error occurred. Please try again later.' : err.message
  });
}

/**
 * 404 Route Not Found Handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}
