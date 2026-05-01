const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // La variable MONGO_URI debe estar en tu archivo .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 MongoDB Conectado exitosamente: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error al conectar con MongoDB: ${error.message}`);
    // Si la base de datos falla, detenemos el servidor
    process.exit(1); 
  }
};

module.exports = connectDB;