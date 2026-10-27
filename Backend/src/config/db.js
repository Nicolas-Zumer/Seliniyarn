// Abre la conexión de Mongoose usando la URL definida en el entorno.
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("Conectado con éxito a la BBDD");
    } catch (error) {
        console.error("Error en la conexión de la BBDD:", error);
        throw error;
    }
}

module.exports = { connectDB }