// Modelo de eventos, productos disponibles, ventas diarias y gastos.
const mongoose = require("mongoose");

const eventProductSchema = new mongoose.Schema(
    {
        plushie: { type: mongoose.Schema.Types.ObjectId, ref: "plushie", required: true },
        name: { type: String, required: true },
        category: { type: String, required: true },
        color: { type: String, default: "" },
        priceCents: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const saleItemSchema = new mongoose.Schema(
    {
        plushie: { type: mongoose.Schema.Types.ObjectId, ref: "plushie", required: true },
        name: { type: String, required: true },
        color: { type: String, default: "" },
        priceCents: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 }
    },
    { _id: false }
);

const salesDaySchema = new mongoose.Schema(
    {
        day: { type: String, required: true },
        note: { type: String, trim: true, default: "" },
        items: { type: [saleItemSchema], default: [] }
    },
    { _id: false }
);

const expenseSchema = new mongoose.Schema(
    {
        day: { type: String, required: true },
        description: { type: String, required: true, trim: true },
        amountCents: { type: Number, required: true, min: 1 }
    },
    { timestamps: true }
);

const eventSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        status: {
            type: String,
            enum: ["scheduled", "open", "closing", "closed"],
            default: "scheduled"
        },
        activeLock: { type: Boolean, default: false },
        stockSnapshot: { type: [eventProductSchema], default: [] },
        sales: { type: [salesDaySchema], default: [] },
        expenses: { type: [expenseSchema], default: [] },
        openedAt: { type: Date },
        closedAt: { type: Date }
    },
    {
        timestamps: true,
        optimisticConcurrency: true
    }
);

// La restricción en MongoDB evita abrir dos eventos incluso con peticiones simultáneas.
eventSchema.index(
    { activeLock: 1 },
    { unique: true, partialFilterExpression: { activeLock: true } }
);

const Event = mongoose.model("event", eventSchema, "event");
module.exports = { Event };
