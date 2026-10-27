// Define las rutas públicas del catálogo y las rutas protegidas de administración.
const { isAdminAuth } = require("../../middleware/isAuth");
const { upload } = require("../../middleware/pictureFile");
const { getPlushies, getAPlushieByName, getPlushieById, addPlushie, updatePlushie, deletePlushie, getPlushiesByCategory } = require("../controllers/plushie");

const plushieRouter = require("express").Router();

plushieRouter.get("/getPlushie", getPlushies);
plushieRouter.get("/getPlushiesByCategory", getPlushiesByCategory);
plushieRouter.get("/getAPlushieByName", getAPlushieByName);
plushieRouter.get("/:id", getPlushieById);
plushieRouter.post("/addPlushie", isAdminAuth, upload.single("img"), addPlushie);
plushieRouter.put("/updatePlushie/:id", isAdminAuth ,updatePlushie);
plushieRouter.delete("/deletePlushie/:id", isAdminAuth ,deletePlushie);

module.exports = {plushieRouter}