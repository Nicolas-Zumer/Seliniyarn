// Middleware de autenticación JWT y autorización por rol o titularidad.
const { User } = require("../api/models/users");
const { verifyJwt } = require("../utils/jwt");

const isAuth = async (req, res, next) => {
    try {
        if (!req.headers.authorization?.startsWith("Bearer ")) {
            return res.status(401).json("Authorization required");
        }
        const token = req.headers.authorization.slice(7);

        const { id } = verifyJwt(token);
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json("User not found");
        }
        user.password = null;
        req.user = user

        next();
    } catch (error) {
        return res.status(401).json("You are unauthorized")
    }
};

const isAdminAuth = async (req, res, next) => {
    try {
        if (!req.headers.authorization?.startsWith("Bearer ")) {
            return res.status(401).json("Authorization required");
        }
        const token = req.headers.authorization.slice(7);
        const { id } = verifyJwt(token);
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json("User not found");
        }
        user.password = null;
        req.user = user
        if(user.rol == "admin"){
            return next();
        }
        return res.status(401).json("You are unauthorized");
    } catch (error) {
        return res.status(401).json("You are unauthorized")
    }
};

const isUserItselfOrAdmin = async (req, res, next) => {
    try {
        if (!req.headers.authorization?.startsWith("Bearer ")) {
            return res.status(401).json("Authorization required");
        }
        const token = req.headers.authorization.slice(7);
        const { id: urlUserId} = req.params;
        const { id: tokenUserId} = verifyJwt(token);
        const user = await User.findById(tokenUserId);
        if (!user) {
            return res.status(401).json("User not found");
        }
        user.password = null;
        req.user = user
        if(user.rol == "admin" || tokenUserId == urlUserId){
            return next();
        }
        return res.status(401).json("You are unauthorized");
    } catch (error) {
        return res.status(401).json("You are unauthorized")
    }
};

module.exports = { isAuth, isAdminAuth, isUserItselfOrAdmin};