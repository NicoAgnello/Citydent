const { upsertUser } = require('../services/clerk.service.js');

const registerUser = async (req, res) => {
  try {
    const { email, firstName, lastName, imageUrl, dni } = req.body;
    const clerkId = req.clerkUserId;

    const user = await upsertUser({ clerkId, email, firstName, lastName, imageUrl, dni });
     res.status(200).json({ success: true, user });
     console.log(`Paso por El back`)
  } catch (error) {     console.error('Error registrando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
module.exports = { registerUser };