const { requestExternalOtp, validateExternalOtp, getExternalData } = require('../services/external.service');

const requestOtp = async (req, res) => {
  try {
    await requestExternalOtp(req.dbUser._id, req.dbUser.email);
    res.status(200).json({ success: true, message: 'Código enviado al correo.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const getData = async (req, res) => {
  try {
    await validateExternalOtp(req.otpCode);
    const data = await getExternalData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.status === 401) return res.status(401).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { requestOtp, getData };
