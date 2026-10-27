// Resumen histórico de ventas de eventos finalizados.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const EURO_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function getEventTotals(event) {
  const revenueCents = (event.sales ?? []).reduce(
    (total, day) => total + day.items.reduce(
      (dayTotal, item) => dayTotal + item.priceCents * item.quantity,
      0
    ),
    0
  );
  const expenseCents = (event.expenses ?? []).reduce(
    (total, expense) => total + expense.amountCents,
    0
  );
  const unitsSold = (event.sales ?? []).reduce(
    (total, day) => total + day.items.reduce((dayTotal, item) => dayTotal + item.quantity, 0),
    0
  );
  return { revenueCents, expenseCents, unitsSold };
}

function SalesHistoric() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/events")
      .then((response) => {
        if (active) setEvents(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            typeof requestError.response?.data === "string"
              ? requestError.response.data
              : "No se pudo cargar el histórico de ventas."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const closedEvents = events.filter((event) => event.status === "closed");
  const totals = closedEvents.reduce(
    (summary, event) => {
      const eventTotals = getEventTotals(event);
      return {
        revenueCents: summary.revenueCents + eventTotals.revenueCents,
        expenseCents: summary.expenseCents + eventTotals.expenseCents,
        unitsSold: summary.unitsSold + eventTotals.unitsSold,
      };
    },
    { revenueCents: 0, expenseCents: 0, unitsSold: 0 }
  );

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="catalog-eyebrow">Panel de administración</p>
          <h1>Histórico de ventas</h1>
          <p className="admin-page-description">Resultados de eventos ya cerrados.</p>
        </div>
        <Link className="admin-secondary-action" to="/Admin/InventoryManagement">
          Calendario de eventos
        </Link>
      </header>

      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="admin-notice">
        Este resumen incluye las ventas de eventos. Las ventas online aún no se
        pueden mostrar porque el proyecto todavía no registra pedidos online.
      </p>

      {loading ? (
        <p className="admin-empty">Cargando histórico...</p>
      ) : (
        <>
          <div className="event-summary-grid">
            <article className="admin-panel event-summary-card">
              <span>Eventos cerrados</span>
              <strong>{closedEvents.length}</strong>
            </article>
            <article className="admin-panel event-summary-card">
              <span>Unidades vendidas</span>
              <strong>{totals.unitsSold}</strong>
            </article>
            <article className="admin-panel event-summary-card">
              <span>Ingresos</span>
              <strong>{EURO_FORMATTER.format(totals.revenueCents / 100)}</strong>
            </article>
            <article className="admin-panel event-summary-card">
              <span>Beneficio neto</span>
              <strong>{EURO_FORMATTER.format((totals.revenueCents - totals.expenseCents) / 100)}</strong>
            </article>
          </div>

          <section className="admin-panel admin-event-list">
            <h2>Eventos</h2>
            {closedEvents.length === 0 ? (
              <p className="admin-empty">Todavía no hay eventos cerrados.</p>
            ) : (
              <ul>
                {closedEvents.map((event) => {
                  const eventTotals = getEventTotals(event);
                  return (
                    <li key={event._id}>
                      <div>
                        <Link to={`/Admin/EventSalesReport/${event._id}`}>{event.name}</Link>
                        <span>
                          {event.startDate === event.endDate
                            ? event.startDate
                            : `${event.startDate} – ${event.endDate}`}
                        </span>
                      </div>
                      <strong>{EURO_FORMATTER.format(eventTotals.revenueCents / 100)}</strong>
                      <Link
                        className="admin-secondary-action"
                        to={`/Admin/EventSalesReport/${event._id}`}
                      >
                        Ver informe
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default SalesHistoric;
