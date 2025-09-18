/**
 * Handle 404 Not Found
 */
export const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
};
