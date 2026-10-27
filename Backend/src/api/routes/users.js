// Asocia las rutas de usuario con sus controladores y permisos.
const { isAdminAuth, isAuth, isUserItselfOrAdmin } = require("../../middleware/isAuth");
const { upload } = require("../../middleware/pictureFile");
const { register, login, rolChange, getUsers, deleteUser, updateUser} = require("../controllers/users");

const UserRouter = require("express").Router();

UserRouter.post("/register", upload.single("profilePicture"), register);
UserRouter.post("/login", login);
UserRouter.post("/rolChange", isAdminAuth, rolChange);
UserRouter.get("/getUsers", isAdminAuth, getUsers);
UserRouter.put("/updateUser/:id", isUserItselfOrAdmin, updateUser);
UserRouter.delete("/deleteUser/:id", isUserItselfOrAdmin, deleteUser);

module.exports = {UserRouter};