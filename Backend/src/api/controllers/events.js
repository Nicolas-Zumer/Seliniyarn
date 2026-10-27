// Operaciones administrativas para planificar, registrar y cerrar eventos.
const mongoose = require("mongoose");
const { Event } = require("../models/events");
const { Plushie } = require("../models/plushie");

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDay(day) {
    if (typeof day !== "string" || !DAY_PATTERN.test(day)) return false;
    const date = new Date(`${day}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day;
}

function dayIsInEvent(event, day) {
    return day === "all" || (
        isValidDay(day) && day >= event.startDate && day <= event.endDate
    );
}

function getSoldQuantities(event, excludedDay) {
    const quantities = new Map();
    for (const salesDay of event.sales) {
        if (salesDay.day === excludedDay) continue;
        for (const item of salesDay.items) {
            const id = item.plushie.toString();
            quantities.set(id, (quantities.get(id) || 0) + item.quantity);
        }
    }
    return quantities;
}

function validateSaleItems(event, items, excludedDay, allowEmpty = false) {
    if (!Array.isArray(items) || (!allowEmpty && items.length === 0)) {
        return { error: "Añade al menos un producto a la venta." };
    }

    const requested = new Map();
    for (const item of items) {
        const id = item?.plushieId;
        const quantity = Number(item?.quantity);
        if (
            !mongoose.isValidObjectId(id) ||
            !Number.isInteger(quantity) ||
            quantity < (allowEmpty ? 0 : 1)
        ) {
            return { error: "Los productos y las cantidades no son válidos." };
        }
        if (quantity > 0) requested.set(id, (requested.get(id) || 0) + quantity);
    }

    const sold = getSoldQuantities(event, excludedDay);
    const snapshotById = new Map(
        event.stockSnapshot.map((product) => [product.plushie.toString(), product])
    );
    for (const [id, quantity] of requested) {
        const product = snapshotById.get(id);
        if (!product) {
            return { error: "El producto no estaba disponible al abrir el evento." };
        }
        if ((sold.get(id) || 0) + quantity > product.quantity) {
            return {
                error: `No puedes registrar más de ${product.quantity} unidades de ${product.name}.`
            };
        }
    }
    return { requested, snapshotById };
}

function buildSaleItems(validated) {
    return [...validated.requested].map(([id, quantity]) => {
        const product = validated.snapshotById.get(id);
        return {
            plushie: product.plushie,
            name: product.name,
            color: product.color,
            priceCents: product.priceCents,
            quantity
        };
    });
}

function handleWriteConflict(error, res) {
    if (error?.name === "VersionError" || error?.code === 11000) {
        return res.status(409).json("El evento ha cambiado en otra solicitud. Recarga la página e inténtalo de nuevo.");
    }
    return null;
}

const getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ startDate: 1, createdAt: 1 });
        return res.status(200).json(events);
    } catch (error) {
        return res.status(500).json("No se pudieron obtener los eventos.");
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json("Evento no encontrado.");
        return res.status(200).json(event);
    } catch (error) {
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(500).json("No se pudo obtener el evento.");
    }
};

const createEvent = async (req, res) => {
    try {
        const { name, startDate, endDate } = req.body;
        if (!name?.trim() || !isValidDay(startDate) || !isValidDay(endDate) || endDate < startDate) {
            return res.status(400).json("Indica un nombre y un intervalo de fechas válido.");
        }
        const event = await Event.create({
            name: name.trim(),
            startDate,
            endDate
        });
        return res.status(201).json(event);
    } catch (error) {
        return res.status(400).json("No se pudo crear el evento.");
    }
};

const deleteScheduledEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.id,
            status: "scheduled"
        });
        if (!event) return res.status(409).json("Solo se pueden eliminar eventos planificados.");
        return res.status(200).json({ message: "Evento eliminado." });
    } catch (error) {
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(500).json("No se pudo eliminar el evento.");
    }
};

const openEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json("Evento no encontrado.");
        if (event.status !== "scheduled") {
            return res.status(409).json("El evento ya se ha iniciado o cerrado.");
        }
        if (await Event.exists({ activeLock: true })) {
            return res.status(409).json("Cierra el evento abierto antes de iniciar otro.");
        }

        const plushies = await Plushie.find();
        event.stockSnapshot = plushies.map((plushie) => ({
            plushie: plushie._id,
            name: plushie.name,
            category: plushie.category,
            color: plushie.color || "",
            priceCents: Math.round(Number(plushie.price) * 100),
            quantity: Number(plushie.availability)
        }));
        event.status = "open";
        event.activeLock = true;
        event.openedAt = new Date();
        await event.save();
        return res.status(200).json(event);
    } catch (error) {
        const conflict = handleWriteConflict(error, res);
        if (conflict) return conflict;
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(500).json("No se pudo iniciar el evento. Puede que ya haya otro evento abierto.");
    }
};

const addSales = async (req, res) => {
    try {
        const { day, items } = req.body;
        const note = typeof req.body.note === "string" ? req.body.note.trim() : "";
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json("Evento no encontrado.");
        if (event.status !== "open") return res.status(409).json("El evento no está abierto.");
        if (!dayIsInEvent(event, day)) return res.status(400).json("El día seleccionado no pertenece al evento.");
        if (day === "all" && !note) return res.status(400).json("Indica el motivo del ajuste global.");

        const validated = validateSaleItems(event, items, null);
        if (validated.error) return res.status(400).json(validated.error);
        const saleItems = buildSaleItems(validated);
        let salesDay = event.sales.find((entry) => entry.day === day);
        if (!salesDay) {
            event.sales.push({ day, note, items: saleItems });
        } else {
            if (note) salesDay.note = note;
            for (const saleItem of saleItems) {
                const existing = salesDay.items.find(
                    (entry) => entry.plushie.toString() === saleItem.plushie.toString()
                );
                if (existing) existing.quantity += saleItem.quantity;
                else salesDay.items.push(saleItem);
            }
        }
        await event.save();
        return res.status(200).json(event);
    } catch (error) {
        const conflict = handleWriteConflict(error, res);
        if (conflict) return conflict;
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(500).json("No se pudieron guardar las ventas.");
    }
};

const updateDaySales = async (req, res) => {
    try {
        const { day, items } = req.body;
        const note = typeof req.body.note === "string" ? req.body.note.trim() : "";
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json("Evento no encontrado.");
        if (event.status !== "open") return res.status(409).json("El evento no está abierto.");
        if (!dayIsInEvent(event, day)) return res.status(400).json("El día seleccionado no pertenece al evento.");
        if (day === "all" && items?.length > 0 && !note) {
            return res.status(400).json("Indica el motivo del ajuste global.");
        }

        const validated = validateSaleItems(event, items, day, true);
        if (validated.error) return res.status(400).json(validated.error);
        const replacementItems = buildSaleItems(validated);
        const salesDayIndex = event.sales.findIndex((entry) => entry.day === day);
        if (replacementItems.length === 0) {
            if (salesDayIndex >= 0) event.sales.splice(salesDayIndex, 1);
        } else if (salesDayIndex >= 0) {
            event.sales[salesDayIndex].items = replacementItems;
            event.sales[salesDayIndex].note = note;
        } else {
            event.sales.push({ day, note, items: replacementItems });
        }

        await event.save();
        return res.status(200).json(event);
    } catch (error) {
        const conflict = handleWriteConflict(error, res);
        if (conflict) return conflict;
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(500).json("No se pudieron actualizar las ventas.");
    }
};

const addExpense = async (req, res) => {
    try {
        const { day, description, amountCents } = req.body;
        const amount = Number(amountCents);
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json("Evento no encontrado.");
        if (event.status !== "open") return res.status(409).json("El evento no está abierto.");
        if (!dayIsInEvent(event, day) || !description?.trim() || !Number.isSafeInteger(amount) || amount < 1) {
            return res.status(400).json("Indica un día, concepto e importe válido.");
        }
        event.expenses.push({ day, description: description.trim(), amountCents: amount });
        await event.save();
        return res.status(201).json(event);
    } catch (error) {
        const conflict = handleWriteConflict(error, res);
        if (conflict) return conflict;
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(500).json("No se pudo guardar el gasto.");
    }
};

const deleteExpense = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json("Evento no encontrado.");
        if (event.status !== "open") return res.status(409).json("El evento no está abierto.");
        const expense = event.expenses.id(req.params.expenseId);
        if (!expense) return res.status(404).json("Gasto no encontrado.");
        expense.deleteOne();
        await event.save();
        return res.status(200).json(event);
    } catch (error) {
        const conflict = handleWriteConflict(error, res);
        if (conflict) return conflict;
        return res.status(500).json("No se pudo eliminar el gasto.");
    }
};

const closeEvent = async (req, res) => {
    let updatedProducts = [];
    let eventId;
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, status: "open", activeLock: true },
            { $set: { status: "closing" }, $inc: { __v: 1 } },
            { new: true }
        );
        if (!event) return res.status(409).json("El evento no está abierto o ya se está cerrando.");
        eventId = event._id;

        const quantities = getSoldQuantities(event);
        for (const [id, quantity] of quantities) {
            if (quantity < 1) continue;
            const result = await Plushie.updateOne(
                { _id: id, availability: { $gte: quantity } },
                { $inc: { availability: -quantity } }
            );
            if (result.modifiedCount !== 1) {
                const stockError = new Error("No hay stock suficiente para cerrar el evento. Revisa el inventario.");
                stockError.status = 409;
                throw stockError;
            }
            updatedProducts.push({ id, quantity });
        }

        const closedEvent = await Event.findOneAndUpdate(
            { _id: eventId, status: "closing" },
            {
                $set: { status: "closed", activeLock: false, closedAt: new Date() },
                $inc: { __v: 1 }
            },
            { new: true }
        );
        if (!closedEvent) throw new Error("No se pudo finalizar el cierre del evento.");
        return res.status(200).json(closedEvent);
    } catch (error) {
        for (const product of updatedProducts.reverse()) {
            await Plushie.updateOne(
                { _id: product.id },
                { $inc: { availability: product.quantity } }
            );
        }
        if (eventId) {
            await Event.updateOne(
                { _id: eventId, status: "closing" },
                { $set: { status: "open", activeLock: true }, $inc: { __v: 1 } }
            );
        }
        if (error.name === "CastError") return res.status(400).json("Identificador de evento no válido.");
        return res.status(error.status || 500).json(error.message || "No se pudo cerrar el evento.");
    }
};

module.exports = {
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
};
