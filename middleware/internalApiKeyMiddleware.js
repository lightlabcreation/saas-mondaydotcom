const internalApiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header('x-api-key');
  const configuredKey = process.env.INTERNAL_API_KEY;

  if (!configuredKey || !apiKey || apiKey !== configuredKey) {
    return res.status(401).json({ msg: 'Unauthorized: Invalid or missing API key' });
  }

  next();
};

module.exports = internalApiKeyMiddleware;
