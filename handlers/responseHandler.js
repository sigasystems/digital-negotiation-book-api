/**
 * Send success response
 */
export const successResponse = (res, status = 200, message = "Success", data ) => {
  return res.status(status).json({
    statusCode: status,
    success: true,
    message,
    data,
  });
};


/**
 * Send error response
 */
export const errorResponse = (res, status = 500, message = "Internal Server Error", error ) => {
  if (!res) {
    console.error("Express response object is undefined in errorResponse:", message, error);
    return;
  }
  return res.status(status).json({
    statusCode: status,
    success: false,
    message,
    error,
  });
};
