// Punto de entrada del servidor: configura middlewares, rutas y conexiones.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const { UserRouter } = require("./src/api/routes/users");
const { connectCloudinary } = require("./src/config/cloudinary");
const { plushieRouter } = require("./src/api/routes/plushie");
const { eventRouter } = require("./src/api/routes/events");
const { Event } = require("./src/api/models/events");

// Acepta el frontend local y los orígenes públicos configurados para producción.
const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS origin not allowed: ${origin}`));
    }
};

const app = express();

app.use(cors(corsOptions))

connectCloudinary();
// Permite recibir cuerpos JSON en las solicitudes.
app.use(express.json());
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
// Monta las rutas de usuarios y productos.
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/music", plushieRouter);
app.use("/api/v1/events", eventRouter);
// Inicia el servidor solo después de conectar con la base de datos.
const startServer = async () => {
    try {
        if (!process.env.DB_URL) {
            throw new Error("Missing required environment variable: DB_URL");
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("Missing required environment variable: JWT_SECRET");
        }
        await connectDB();
        await Event.init();
        const port = process.env.PORT || 3000;
        app.listen(port, "0.0.0.0", () => {
            console.log(`API listening on port ${port}`);
        });
    } catch (error) {
        console.error("The server could not start:", error);
        process.exitCode = 1;
    }
};

startServer();