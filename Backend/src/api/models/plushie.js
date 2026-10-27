// Define los campos y tipos de datos de cada producto del catálogo.
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const plushieSchema = new Schema (
    {
        name: { type: String, required: true },
        category: { type: String, required: true },
        collection1: {type: String, required: true},
        img: {type: String},
        price: {type: Number, required: true, min: 0},
        height: {type: Number, min: 0},
        width: {type: Number, min: 0},
        Weight: {type: Number, min: 0},
        availability: {type: Number, required:true, min: 0},
        color: {type: String}
    },
    {
        timestamps: true,
    }
);

const Plushie = mongoose.model('plushie', plushieSchema, 'plushie');
module.exports = { Plushie };