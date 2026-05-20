//Generar un middel para hacer el upload a claudinary con las imagenes traidas en el post de incidentes, 
// se debe rescatar la url de la imagen y parsear al objeto de incidente para grabar la url en la DB
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Asegúrate de configurar Cloudinary con tus variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Paso 1: Multer parsea el request y guarda en memoria RAM
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB por seguridad
});

// Pasos 2 y 3: Lógica de subida y parseo
const processIncidentData = async (req, res, next) => {
  try {
    // Paso 2: Subir cada archivo a Cloudinary
    if (req.files && req.files.length > 0) {
      const urls = await Promise.all(
        req.files.map((file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'cityfixer/incidents' },
              (error, result) => error ? reject(error) : resolve(result.secure_url)
            ).end(file.buffer);
          })
        )
      );
      req.body.photos = urls; // Inyecta las URLs generadas
    } else {
      req.body.photos = []; // Si no hay fotos, aseguramos que sea un array vacío
    }

    // Paso 3: Parsear location de JSON string a objeto
    if (req.body.location && typeof req.body.location === 'string') {
      req.body.location = JSON.parse(req.body.location);
    }

    // Todo listo, pasamos el objeto req limpio al Controller
    next();
  } catch (error) {
    console.error('Error en uploadToCloudinary middleware:', error);
    return res.status(500).json({ 
      message: 'Error procesando los datos o subiendo imágenes', 
      error: error.message 
    });
  }
};

// Exportamos el middleware como un arreglo. Express ejecutará upload.array primero, y processIncidentData después.
module.exports = [upload.array('photos', 3), processIncidentData];//