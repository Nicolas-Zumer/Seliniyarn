// Controladores para consultar y gestionar los productos de la tienda.
const { Plushie } = require("../models/plushie");
const { Event } = require("../models/events");

// Devuelve todos los peluches del catálogo.
const getPlushies = async (req, res, next) => {
    try {
        const plushie = await Plushie.find();
        res.status(200).json(plushie);
    } catch (error) {
        res.status(400).json("Error while getting the plushies information")
    }
}

// Filtra el catálogo por la categoría indicada en la consulta.
const getPlushiesByCategory = async (req, res, next) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json("Category is required");
    }

    const plushies = await Plushie.find({ category });
    return res.status(200).json(plushies);
  } catch (error) {
    return res.status(500).json("Error while getting plushies by category");
  }
};

// Busca un peluche por su nombre.
const getAPlushieByName = async (req, res, next) => {
    try {
        const plushie = await Plushie.findOne({ name: req.query.name })
        if (!plushie) {
            return res.status(404).json("Plushie not found")
        }
        res.status(200).json(plushie)
    } catch (error) {
        res.status(400).json("Error while getting the plushie information")
    }
}

// Busca un peluche por su identificador.
const getPlushieById = async (req, res) => {
    try {
        const plushie = await Plushie.findById(req.params.id);
        if (!plushie) {
            return res.status(404).json("Plushie not found")
        }
        return res.status(200).json(plushie);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json("Invalid plushie id")
        }
        return res.status(500).json("Error while getting the plushie information")
    }
}

// Crea un producto y guarda su imagen si se ha subido una.
const addPlushie = async (req, res, next) => {
    try {
        const newPlushie = new Plushie(req.body);
        const { name, category, collection1, color } = req.body;
        const colorFilter = color ? color : { $in: [null, ""] };
        const duplicatedPlushie = await Plushie.findOne({
            name,
            category,
            collection1,
            color: colorFilter
        });
        if(duplicatedPlushie){
            return res.status(400).json("There is already a plushie registered with those product details")
        };
        if(req.file){
            newPlushie.img = req.file.path;
        }
        const savedNewPlushie = await newPlushie.save();
        return res.status(200).json(savedNewPlushie);
    } catch (error) {
        res.status(400).json("Error while adding plushie, please try again later")
    }
};

// Actualiza los campos de un producto existente.
const updatePlushie = async (req, res, next) => {
    try {
        const { id } = req.params;
        const plushieUpdated = await Plushie.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!plushieUpdated) {
            return res.status(404).json("Plushie not found")
        }
        return res.status(200).json(plushieUpdated);
    } catch (error) {
        res.status(400).json("Error while updating Plushie, please try again later")
    }
}

// Elimina un producto del catálogo.
const deletePlushie = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productInActiveEvent = await Event.exists({
            activeLock: true,
            "stockSnapshot.plushie": id
        });
        if (productInActiveEvent) {
            return res.status(409).json("No se puede eliminar un producto incluido en un evento abierto.");
        }
        const plushieDeleted = await Plushie.findByIdAndDelete(id);
        if (!plushieDeleted) {
            return res.status(404).json("Plushie not found")
        }
        return res.status(200).json({
            message: "Elemento eliminado",
            elemento: plushieDeleted
        })
    } catch (error) {
        res.status(400).json("Error while deleting Plushie information, please try again later")
    }
}
module.exports = { 
    getPlushies,
    getPlushiesByCategory,
    getAPlushieByName,
    getPlushieById,
    addPlushie,
    updatePlushie,
    deletePlushie
 };