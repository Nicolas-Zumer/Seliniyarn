// Controladores para registrar, autenticar y gestionar usuarios.
const bcrypt = require("bcrypt");
const { generateSign } = require("../../utils/jwt");
const { User } = require("../models/users");
const { deleteFiles } = require("../../utils/deleteFiles");

// Registra una cuenta nueva con rol de usuario.
const register = async (req, res, next) => {
    try {
        const user = new User(req.body);
        //Verify the new user is not duplicate
        const duplicatedUser = await User.findOne({ email: req.body.email });
        if(duplicatedUser){
            return res.status(400).json("Ya existe un usuario registrado con este email.")
        };
        //Check if the user is trying tu upload a file(picture) and in that case executes the code to handle it.
        if(req.file){
            user.profilePicture = req.file.path;
        }
        //Set the rol of all users to user.
        user.rol = "user";
        await user.save();
        return res.status(200).json("User registered succesfully")
    } catch (error) {
        res.status(400).json("error en el registro");
    };
};

// Comprueba las credenciales y devuelve un JWT para la sesión.
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        //Take the user input and search an user with the email provided
        const user = await User.findOne({ email });
        //If the user doesnt exists, return a failure
        if(!user){
            return res.status(400).json("Usuario o contraseña incorrectos")
        }
        //Compare the password provided with the db one, encrypting the provided fisrt, and then comparing the result.
        if(bcrypt.compareSync(password, user.password)){
            const token = generateSign(user._id);
            //Deletes the password for safety purposes
            user.password = undefined;
            return res.status(200).json({ token, user })
        }else{
            //In case the password is incorrect.
            return res.status(400).json("Usuario o contraseña incorrectos")
        }
    } catch (error) {
        res.status(400).json("error en el inicio de sesión");
    };
};

// Cambia el rol de una cuenta; la ruta requiere permisos de administrador.
const rolChange = async (req, res, next) => {
    try {
        //Change the rol of an user, for admin use only
        const { email, rol } = req.body;
        //Checks if the rol is correctly spelled or is one of the actives ones.
        if (!["user", "admin"].includes(rol)) {
            return res.status(400).json("Invalid role");
        }
        //Get the user to change the rol.
        const user = await User.findOne({ email });
        //If the user doesnt exists exits the code.
        if (!user) {
            return res.status(404).json("User not found");
        }
        //Changes the rol of the user for the new rol
        user.rol = rol;
        const userSaved = await user.save();
        return res.status(200).json(`Rol del usuario ${userSaved.name} cambiado a ${rol} de manera satisfactoria`)
    } catch (error) {
        res.status(400).json("error al cambiar el rol del usuario");
    };
};

// Devuelve la lista de usuarios sin incluir sus contraseñas.
const getUsers = async (req, res, next) => {
    try {
        //Get all the user data, for admin use only
        const users = await User.find().select("-password")
        return res.status(200).json(users)
    } catch (error) {
        res.status(400).json("error al obtener la lista de usuarios")
    }
}

// Elimina la cuenta solicitada y su imagen de perfil.
const deleteUser = async (req, res, next) => {
    try {
        const idToDelete = req.user.rol === "admin" ? req.params.id : req.user._id;
        const userDeleted = await User.findByIdAndDelete(idToDelete);
        if (!userDeleted) {
            return res.status(404).json("User not found")
        }
        deleteFiles(userDeleted.profilePicture);
        return res.status(200).json("Cuenta eliminada con exito")
    } catch (error) {
        res.status(400).json("error al eliminar el usuario")
    }
}

// Actualiza los datos permitidos del perfil.
const updateUser = async (req, res) => {
    try {
        //We get the id of the user to change from the url and the user that is requesting the change from the token autorization(isAuth.js).
        const { id } = req.params;
        const requestingUser = req.user;
        const userToUpdate = await User.findById(id);

        if (!userToUpdate) {
            return res.status(404).json("User not found");
        }
        //We check which changes the user is requesting to change, and the properties that do not change, we get the values from the previoues ones.
        const {
            name,
            email,
            password,
            profilePicture,
        } = req.body;

        if (name !== undefined) userToUpdate.name = name;
        if (email !== undefined) userToUpdate.email = email;
        if (profilePicture !== undefined) {
            userToUpdate.profilePicture = profilePicture;
        }

        if (password !== undefined && password !== "") {
            userToUpdate.password = password;
        }
        //If the user is not an admin, the rol is allways set to user, to prevent an user to change it user rol.
        if (requestingUser.rol !== "admin") {
            userToUpdate.rol = "user";
        }
        //We save the changes pf the user, because this way if the user changes the password, the encryption works and the password is not visible, if we only used the findByIdAndupdate the password would not be encrypted.
        const savedUser = await userToUpdate.save();

        const responseUser = savedUser.toObject();
        delete responseUser.password;

        return res.status(200).json({
            message: "User profile updated successfully",
            user: responseUser
        });
    } catch (error) {
        return res.status(400).json("Error updating the user");
    }
};

module.exports = {
    register,
    login,
    rolChange,
    getUsers,
    deleteUser,
    updateUser
}