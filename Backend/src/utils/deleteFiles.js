// Elimina de Cloudinary una imagen a partir de su URL pública.
const cloudinary = require("cloudinary").v2;
const deleteFiles = (url) => {
    if(!url){
        return;
    }
    // Ejemplo de URL https://res.cloudinary.com/khbsoc4j/image/upload/v1787669244/FAPIFiles/xtp7ysyljtanfz3tmcvn.png

    const array = url.split("/");
    const name = array.at("-1").split(".")[0];
    let public_id = `${array.at("-2")}/${name}`

    cloudinary.uploader.destroy(public_id, () => {
        console.log("imagen eliminada");
    });
}

module.exports = { deleteFiles }