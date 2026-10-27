// Carga los productos del CSV en la base de datos de peluches.
const mongoose = require("mongoose");

const { Plushie } = require("../../api/models/plushie");

const csv = require('csv-parser')
const fs = require('fs');
const results = [];
const path = require("path");
require("dotenv").config();

const leerCSV = () => new Promise ((resolve, reject) => {
    const csvPath = path.join(__dirname, "../../data/BBDD_Seliniyarn.csv");

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => {
            if (data.weight !== undefined) {
                data.Weight = data.weight;
                delete data.weight;
            }
            results.push(data);
        })
        .on("error", reject)
        .on("end", resolve);
})

// Reemplaza el catálogo actual por los productos del CSV.
const lanzarSemilla = async () =>{
   try {
        await leerCSV();
        await mongoose.connect(process.env.DB_URL);
        await Plushie.deleteMany({});
        console.log("Peluches eliminados")
        await Plushie.insertMany(results)
        console.log("Peluches introducidos")
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("Desconexion de la BBDD");
        }
    }
}


lanzarSemilla();