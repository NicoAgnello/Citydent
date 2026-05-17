// Middelware de multer y parseo de imagenesconst multer = require('multer');

// Usamos la memoria (RAM) para no guardar los archivos físicamente en el servidor
const storage = multer.memoryStorage();

// Configuramos Multer: aceptamos un máximo de 5MB por imagen
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Exportamos el middleware configurado para aceptar múltiples fotos (ej. hasta 4)
// 'photos' es el nombre del campo que debe enviar el frontend
module.exports = upload.array('photos', 3);