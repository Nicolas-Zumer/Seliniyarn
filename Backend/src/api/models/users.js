// Define los datos de usuario y cifra la contraseña antes de guardarla.
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const userSchema = new Schema (
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        rol: { type: String },
        profilePicture: { type: String },
    },
    {
        timestamps: true,
    }
);
// Cifra la contraseña solo cuando se crea o modifica.
userSchema.pre("save", function(){
    if (this.isModified("password")) {
        this.password = bcrypt.hashSync(this.password, 10);
    }
})

const User = mongoose.model('user', userSchema, 'user');
module.exports = { User };