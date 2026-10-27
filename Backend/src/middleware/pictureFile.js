// Configura Multer para subir imágenes de perfil y productos a Cloudinary.
const cloudinary = require("cloudinary");
const multer = require("multer");
const CloudinaryStorage = require("multer-storage-cloudinary");
const storage = CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Sel_Shop_Files",
        allowedFormats: ["jpg", "jpeg", "png", "gif", "webp"]
    }
})

const upload = multer({ storage });

module.exports = { upload };