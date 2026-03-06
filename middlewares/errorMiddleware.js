const globalErrorHandler = (err, req, res, next) => {
    console.error("🚩 Error Stack:", err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

module.exports = { globalErrorHandler };