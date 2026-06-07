const externalAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const otpCode = req.headers['x-otp-code'];

  if (!apiKey || apiKey !== process.env.SCOPE_API_KEY) {
    return res.status(401).json({ error: 'API Key inválida.' });
  }

  if (!otpCode) {
    return res.status(401).json({ error: 'Se requiere el código OTP en el header x-otp-code.' });
  }

  req.otpCode = otpCode;
  next();
};

module.exports = { externalAuth };
