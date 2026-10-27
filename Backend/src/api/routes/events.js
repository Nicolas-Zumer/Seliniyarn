// Rutas de eventos protegidas para el panel administrativo.
const { isAdminAuth } = require("../../middleware/isAuth");
const {
    getEvents,
    getEventById,
    createEvent,
    deleteScheduledEvent,
    openEvent,
    addSales,
    updateDaySales,
    addExpense,
    deleteExpense,
    closeEvent
} = require("../controllers/events");

const eventRouter = require("express").Router();

eventRouter.use(isAdminAuth);
eventRouter.get("/", getEvents);
eventRouter.get("/:id", getEventById);
eventRouter.post("/", createEvent);
eventRouter.delete("/:id", deleteScheduledEvent);
eventRouter.post("/:id/open", openEvent);
eventRouter.post("/:id/sales", addSales);
eventRouter.put("/:id/sales", updateDaySales);
eventRouter.post("/:id/expenses", addExpense);
eventRouter.delete("/:id/expenses/:expenseId", deleteExpense);
eventRouter.post("/:id/close", closeEvent);

module.exports = { eventRouter };
