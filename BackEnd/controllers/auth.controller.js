/// Manejo de webhook y sync con clerk
const { Webhook } = require('svix');
const User = require('../models/user');

const clerkWebhook = async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error('Falta CLERK_WEBHOOK_SECRET en .env');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  // 1. Extraer los headers de Svix enviados por Clerk
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Faltan headers de verificación (Svix)' });
  }

  // 2. Obtener el payload crudo
  const payload = req.body;
  const wh = new Webhook(SIGNING_SECRET);
  let evt;

  // 3. Verificar que la petición realmente viene de Clerk
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verificando webhook de Clerk:', err.message);
    return res.status(400).json({ error: 'Verificación de webhook fallida' });
  }

  // 4. Sincronizar con MongoDB según el evento
  const { id } = evt.data;
  const eventType = evt.type;

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const email = evt.data.email_addresses[0]?.email_address;
      const firstName = evt.data.first_name || '';
      const lastName = evt.data.last_name || '';

      // upsert: true crea el documento si no existe, o lo actualiza si ya existe
      await User.findOneAndUpdate(
        { clerkId: id },
        { email, firstName, lastName },
        { upsert: true, new: true }
      );
      console.log(`✅ Usuario ${eventType === 'user.created' ? 'creado' : 'actualizado'} en MongoDB: ${email}`);
    }

    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`🗑️ Usuario eliminado de MongoDB: ${id}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook procesado correctamente' });
  } catch (error) {
    console.error('❌ Error de base de datos en webhook:', error);
    return res.status(500).json({ error: 'Error interno sincronizando usuario' });
  }
};

module.exports = { clerkWebhook };