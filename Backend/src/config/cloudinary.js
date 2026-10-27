// Configura Cloudinary con las credenciales almacenadas en el entorno.
const cloudinary = require("cloudinary").v2;

const connectCloudinary = () =>{
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_cloud_name,
            api_key: process.env.CLOUDINARY_api_key,
            api_secret: process.env.CLOUDINARY_api_secret
        });
        console.log("Conectado con exito a Cloudinary")
    } catch (error) {
        console.error("Error al configurar Cloudinary:", error)
    }
};

module.exports = { connectCloudinary }