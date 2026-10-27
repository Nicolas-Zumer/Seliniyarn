// Informe de evento: ventas por día, gastos, ajustes y cierre de inventario.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

const EURO_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function getEventDays(event) {
  const days = [];
  const current = new Date(`${event.startDate}T00:00:00`);
  const end = new Date(`${event.endDate}T00:00:00`);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function productLabel(product) {
  return product.color
    ? `${product.name} · ${product.color}`
    : product.name;
}

function EventSalesReport() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState("all");
  const [saleDay, setSaleDay] = useState("all");
  const [saleNote, setSaleNote] = useState("");
  const [saleLines, setSaleLines] = useState([]);
  const [salesDialog, setSalesDialog] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    day: "all",
    description: "",
    amount: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/events/${eventId}`)
      .then((response) => {
        if (!active) return;
        setEvent(response.data);
        setExpenseForm((current) => ({
          ...current,
          day: current.day === "all" || current.day >= response.data.startDate
            ? current.day
            : response.data.startDate,
        }));
      })
      .catch((requestError) => {
        if (active) {
          setError(
            typeof requestError.response?.data === "string"
              ? requestError.response.data
              : "No se pudo cargar el informe del evento."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const eventDays = useMemo(
    () => event ? getEventDays(event) : [],
    [event]
  );
  const soldByProduct = useMemo(() => {
    const totals = new Map();
    for (const salesDay of event?.sales ?? []) {
      for (const item of salesDay.items) {
        const id = item.plushie;
        const key = typeof id === "string" ? id : id.toString();
        totals.set(key, (totals.get(key) || 0) + item.quantity);
      }
    }
    return totals;
  }, [event]);

  const visibleSales = useMemo(() => {
    const totals = new Map();
    for (const salesDay of event?.sales ?? []) {
      if (selectedDay !== "all" && salesDay.day !== selectedDay) continue;
      for (const item of salesDay.items) {
        const key = item.plushie.toString();
        const previous = totals.get(key);
        if (previous) previous.quantity += item.quantity;
        else totals.set(key, { ...item, quantity: item.quantity });
      }
    }
    return [...totals.values()];
  }, [event, selectedDay]);

  const visibleExpenses = useMemo(
    () => (event?.expenses ?? []).filter(
      (expense) => selectedDay === "all" || expense.day === selectedDay
    ),
    [event, selectedDay]
  );
  const grossCents = visibleSales.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0
  );
  const expensesCents = visibleExpenses.reduce(
    (total, expense) => total + expense.amountCents,
    0
  );
  const soldCount = visibleSales.reduce((total, item) => total + item.quantity, 0);

  function openSalesDialog(mode) {
    setError("");
    setSuccess("");
    setSalesDialog(mode);
    setSaleDay(selectedDay);
    setSaleNote(
      mode === "edit"
        ? event.sales.find((entry) => entry.day === selectedDay)?.note ?? ""
        : ""
    );
    if (mode === "edit") {
      const daySales = event.sales.find((entry) => entry.day === selectedDay);
      setSaleLines(
        daySales?.items.map((item) => ({
          plushieId: item.plushie.toString(),
          quantity: String(item.quantity),
        })) ?? [{ plushieId: "", quantity: "0" }]
      );
    } else {
      setSaleLines([{ plushieId: "", quantity: "1" }]);
    }
  }

  function handleSaleDayChange(day) {
    setSaleDay(day);
    const daySales = event.sales.find((entry) => entry.day === day);
    setSaleNote(salesDialog === "edit" ? daySales?.note ?? "" : "");
    if (salesDialog !== "edit") return;
    setSaleLines(
      daySales?.items.map((item) => ({
        plushieId: item.plushie.toString(),
        quantity: String(item.quantity),
      })) ?? [{ plushieId: "", quantity: "0" }]
    );
  }

  function updateSaleLine(index, field, value) {
    setSaleLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function getRemaining(plushieId) {
    const product = event.stockSnapshot.find(
      (entry) => entry.plushie.toString() === plushieId
    );
    if (!product) return 0;
    const sold = soldByProduct.get(plushieId) || 0;
    if (salesDialog === "edit") {
      const selectedSales = event.sales.find((entry) => entry.day === saleDay);
      const onSelectedDay = selectedSales?.items.find(
        (entry) => entry.plushie.toString() === plushieId
      )?.quantity ?? 0;
      return product.quantity - sold + onSelectedDay;
    }
    return product.quantity - sold;
  }

  async function handleSaveSales(submitEvent) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const items = saleLines
      .filter((line) => line.plushieId && Number.isInteger(Number(line.quantity)))
      .map((line) => ({
        plushieId: line.plushieId,
        quantity: Number(line.quantity),
      }));
    try {
      const response = salesDialog === "edit"
        ? await api.put(`/events/${eventId}/sales`, { day: saleDay, note: saleNote, items })
        : await api.post(`/events/${eventId}/sales`, { day: saleDay, note: saleNote, items });
      setEvent(response.data);
      setSalesDialog("");
      setSuccess(salesDialog === "edit" ? "Ventas del día actualizadas." : "Venta añadida.");
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo guardar la venta."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExpense(submitEvent) {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const amountCents = Math.round(Number(expenseForm.amount) * 100);
      const response = await api.post(`/events/${eventId}/expenses`, {
        day: expenseForm.day,
        description: expenseForm.description,
        amountCents,
      });
      setEvent(response.data);
      setExpenseForm((current) => ({ ...current, description: "", amount: "" }));
      setSuccess("Gasto añadido.");
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo guardar el gasto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(expenseId) {
    setError("");
    setSuccess("");
    try {
      const response = await api.delete(
        `/events/${eventId}/expenses/${expenseId}`
      );
      setEvent(response.data);
      setSuccess("Gasto eliminado.");
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo eliminar el gasto."
      );
    }
  }

  async function handleCloseEvent() {
    if (!window.confirm(
      "Al cerrar el evento se descontarán del inventario las unidades vendidas y no se podrá volver a editarlo. ¿Continuar?"
    )) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.post(`/events/${eventId}/close`);
      setEvent(response.data);
      setSuccess("Evento cerrado y ventas descontadas del inventario.");
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo cerrar el evento."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="admin-empty">Cargando informe del evento...</p>;
  }

  if (!event) {
    return (
      <section className="admin-page">
        <p className="admin-error" role="alert">{error || "No se encontró el evento."}</p>
        <Link className="admin-secondary-action" to="/Admin/InventoryManagement">
          Volver al calendario
        </Link>
      </section>
    );
  }

  const eventStatus = event.status === "scheduled" ? "Planificado" :
    event.status === "open" ? "Abierto" :
      event.status === "closing" ? "Cerrando" : "Cerrado";

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <Link className="admin-back-link" to="/Admin/InventoryManagement">
            ← Calendario de eventos
          </Link>
          <p className="catalog-eyebrow">Informe de ventas del evento</p>
          <h1>{event.name}</h1>
          <p className="admin-page-description">
            {event.startDate === event.endDate
              ? event.startDate
              : `${event.startDate} – ${event.endDate}`}
            {" · "}
            <span className={`event-status event-status-${event.status}`}>{eventStatus}</span>
          </p>
        </div>
        {event.status === "open" && (
          <button
            className="primary-action"
            type="button"
            disabled={saving}
            onClick={handleCloseEvent}
          >
            Cerrar evento
          </button>
        )}
      </header>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}

      {event.status === "scheduled" && (
        <p className="admin-notice">
          Inicia el evento desde el calendario para capturar el inventario y habilitar el registro de ventas.
        </p>
      )}
      {event.status === "open" && (
        <p className="admin-notice">
          El stock disponible para este evento se capturó al iniciarlo. No se puede registrar más que esa cantidad.
        </p>
      )}

      <div className="event-report-toolbar">
        <label>
          Mostrar
          <select value={selectedDay} onChange={(inputEvent) => setSelectedDay(inputEvent.target.value)}>
            <option value="all">Todos los días</option>
            {eventDays.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
        </label>
        {event.status === "open" && (
          <div className="admin-page-actions">
            <button className="admin-secondary-action" type="button" onClick={() => openSalesDialog("edit")}>
              Ajustar ventas
            </button>
            <button className="primary-action" type="button" onClick={() => openSalesDialog("add")}>
              Añadir venta
            </button>
          </div>
        )}
      </div>

      <div className="event-summary-grid">
        <article className="admin-panel event-summary-card">
          <span>Unidades vendidas</span>
          <strong>{soldCount}</strong>
        </article>
        <article className="admin-panel event-summary-card">
          <span>Ingresos</span>
          <strong>{EURO_FORMATTER.format(grossCents / 100)}</strong>
        </article>
        <article className="admin-panel event-summary-card">
          <span>Gastos</span>
          <strong>{EURO_FORMATTER.format(expensesCents / 100)}</strong>
        </article>
        <article className="admin-panel event-summary-card">
          <span>Beneficio neto</span>
          <strong>{EURO_FORMATTER.format((grossCents - expensesCents) / 100)}</strong>
        </article>
      </div>

      <div className="event-report-columns">
        <section className="admin-panel event-sales-panel">
          <h2>{selectedDay === "all" ? "Ventas registradas" : `Ventas del ${selectedDay}`}</h2>
          {event.sales
            .filter((entry) => entry.day === "all" && entry.note && selectedDay === "all")
            .map((entry, index) => (
              <p className="admin-notice" key={`adjustment-${index}`}>
                Ajuste global: {entry.note}
              </p>
            ))}
          {visibleSales.length === 0 ? (
            <p className="admin-empty">No hay ventas registradas para este periodo.</p>
          ) : (
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr><th>Producto</th><th>Unidades</th><th>Precio</th><th>Importe</th></tr>
                </thead>
                <tbody>
                  {visibleSales.map((item) => (
                    <tr key={item.plushie.toString()}>
                      <td>{productLabel(item)}</td>
                      <td>{item.quantity}</td>
                      <td>{EURO_FORMATTER.format(item.priceCents / 100)}</td>
                      <td>{EURO_FORMATTER.format(item.priceCents * item.quantity / 100)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><th colSpan="3">Total</th><th>{EURO_FORMATTER.format(grossCents / 100)}</th></tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel event-expenses-panel">
          <h2>Gastos</h2>
          {event.status === "open" && (
            <form className="event-expense-form" onSubmit={handleAddExpense}>
              <label>
                Día
                <select
                  value={expenseForm.day}
                  onChange={(inputEvent) =>
                    setExpenseForm((current) => ({ ...current, day: inputEvent.target.value }))
                  }
                >
                  <option value="all">Todos los días / ajuste</option>
                  {eventDays.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              <label>
                Concepto
                <input
                  value={expenseForm.description}
                  onChange={(inputEvent) =>
                    setExpenseForm((current) => ({ ...current, description: inputEvent.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Importe (€)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(inputEvent) =>
                    setExpenseForm((current) => ({ ...current, amount: inputEvent.target.value }))
                  }
                  required
                />
              </label>
              <button className="primary-action" type="submit" disabled={saving}>
                Añadir gasto
              </button>
            </form>
          )}
          {visibleExpenses.length === 0 ? (
            <p className="admin-empty">No hay gastos para este periodo.</p>
          ) : (
            <ul className="event-expense-list">
              {visibleExpenses.map((expense) => (
                <li key={expense._id}>
                  <div>
                    <strong>{expense.description}</strong>
                    <span>{expense.day === "all" ? "Todos los días / ajuste" : expense.day}</span>
                  </div>
                  <strong>{EURO_FORMATTER.format(expense.amountCents / 100)}</strong>
                  {event.status === "open" && (
                    <button
                      className="admin-danger-action"
                      type="button"
                      aria-label={`Eliminar gasto ${expense.description}`}
                      onClick={() => handleDeleteExpense(expense._id)}
                    >
                      Eliminar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel event-stock-panel">
        <h2>Stock del evento</h2>
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr><th>Producto</th><th>Inicial</th><th>Vendido</th><th>Restante para vender</th></tr>
            </thead>
            <tbody>
              {event.stockSnapshot.map((product) => {
                const id = product.plushie.toString();
                const sold = soldByProduct.get(id) || 0;
                return (
                  <tr key={id}>
                    <td>{productLabel(product)}</td>
                    <td>{product.quantity}</td>
                    <td>{sold}</td>
                    <td>{product.quantity - sold}</td>
                  </tr>
                );
              })}
              {event.stockSnapshot.length === 0 && (
                <tr><td colSpan="4">El inventario se captura al iniciar el evento.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {salesDialog && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) setSalesDialog("");
          }}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-dialog-title"
          >
            <button
              className="admin-modal-close"
              type="button"
              aria-label="Cerrar"
              onClick={() => setSalesDialog("")}
            >
              ×
            </button>
            <p className="catalog-eyebrow">Registro de ventas</p>
            <h2 id="sales-dialog-title">
              {salesDialog === "edit" ? "Ajustar cantidades del día" : "Añadir venta"}
            </h2>
            <form className="admin-form" onSubmit={handleSaveSales}>
              <label>
                Día
                <select value={saleDay} onChange={(inputEvent) => handleSaleDayChange(inputEvent.target.value)}>
                  <option value="all">Todos los días / ajuste</option>
                  {eventDays.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              {saleDay === "all" && (
                <label>
                  Motivo del ajuste global
                  <input
                    value={saleNote}
                    onChange={(inputEvent) => setSaleNote(inputEvent.target.value)}
                    required
                  />
                </label>
              )}
              {saleLines.map((line, index) => (
                <div className="sales-entry-row" key={`sale-line-${index}`}>
                  <label>
                    Producto
                    <select
                      value={line.plushieId}
                      onChange={(inputEvent) => updateSaleLine(index, "plushieId", inputEvent.target.value)}
                      required
                    >
                      <option value="">Selecciona un producto</option>
                      {event.stockSnapshot.map((product) => {
                        const id = product.plushie.toString();
                        const remaining = getRemaining(id);
                        return (
                          <option key={id} value={id} disabled={remaining < 1 && id !== line.plushieId}>
                            {productLabel(product)} · quedan {remaining}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label>
                    Cantidad
                    <input
                      type="number"
                      min={salesDialog === "edit" ? "0" : "1"}
                      max={line.plushieId ? getRemaining(line.plushieId) : undefined}
                      step="1"
                      value={line.quantity}
                      onChange={(inputEvent) => updateSaleLine(index, "quantity", inputEvent.target.value)}
                      required
                    />
                  </label>
                  {saleLines.length > 1 && (
                    <button
                      className="admin-danger-action"
                      type="button"
                      onClick={() => setSaleLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
              <button
                className="admin-secondary-action"
                type="button"
                onClick={() => setSaleLines((current) => [...current, { plushieId: "", quantity: "1" }])}
              >
                Añadir otro producto
              </button>
              <div className="admin-modal-actions">
                <button className="primary-action" type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button className="admin-secondary-action" type="button" onClick={() => setSalesDialog("")}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

export default EventSalesReport;
