/**
 * Send success response
 */
export const successResponse = (res, status = 200, message = "Success", data = {}) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 */
export const errorResponse = (res, status = 500, message = "Internal Server Error", error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
};
