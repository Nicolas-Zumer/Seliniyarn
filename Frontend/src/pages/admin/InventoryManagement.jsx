// Calendario mensual para planificar, iniciar y consultar eventos.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const EMPTY_EVENT = { name: "", startDate: "", endDate: "" };
const MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - mondayOffset
  );
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });
}

function InventoryManagement() {
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState(() => new Date());
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [showEventForm, setShowEventForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudieron cargar los eventos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
              : "No se pudieron cargar los eventos."
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

  const calendarDays = useMemo(() => getCalendarDays(month), [month]);
  const activeEvent = events.find((event) => event.activeLock);

  function eventsOnDay(day) {
    const key = dateKey(day);
    return events.filter(
      (event) => key >= event.startDate && key <= event.endDate
    );
  }

  async function handleCreateEvent(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/events", eventForm);
      setEventForm(EMPTY_EVENT);
      setShowEventForm(false);
      await loadEvents();
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo crear el evento."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenEvent(eventId) {
    setError("");
    try {
      await api.post(`/events/${eventId}/open`);
      await loadEvents();
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo iniciar el evento."
      );
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm("¿Quieres eliminar este evento planificado?")) return;
    setError("");
    try {
      await api.delete(`/events/${eventId}`);
      await loadEvents();
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo eliminar el evento."
      );
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="catalog-eyebrow">Panel de administración</p>
          <h1>Gestión de inventario y eventos</h1>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-secondary-action" to="/Admin/Inventory">
            Inventario
          </Link>
          <Link className="admin-secondary-action" to="/Admin/SalesHistoric">
            Ventas totales
          </Link>
          <button
            className="primary-action"
            type="button"
            onClick={() => setShowEventForm((visible) => !visible)}
          >
            {showEventForm ? "Cancelar" : "Añadir evento"}
          </button>
        </div>
      </header>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {showEventForm && (
        <form className="admin-panel admin-event-form" onSubmit={handleCreateEvent}>
          <h2>Planificar evento</h2>
          <label>
            Nombre del evento
            <input
              value={eventForm.name}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Primer día
            <input
              type="date"
              value={eventForm.startDate}
              onChange={(event) =>
                setEventForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                  endDate: current.endDate && current.endDate < event.target.value
                    ? event.target.value
                    : current.endDate,
                }))
              }
              required
            />
          </label>
          <label>
            Último día
            <input
              type="date"
              min={eventForm.startDate || undefined}
              value={eventForm.endDate}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, endDate: event.target.value }))
              }
              required
            />
          </label>
          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar evento"}
          </button>
        </form>
      )}

      {activeEvent && (
        <p className="admin-notice" role="status">
          Hay un evento abierto: <strong>{activeEvent.name}</strong>. Cierra ese
          evento antes de iniciar otro.
        </p>
      )}

      <section className="admin-panel event-calendar-panel" aria-label="Calendario de eventos">
        <div className="calendar-toolbar">
          <button
            className="calendar-nav-button"
            type="button"
            aria-label="Mes anterior"
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <h2>{MONTH_FORMATTER.format(month)}</h2>
          <button
            className="calendar-nav-button"
            type="button"
            aria-label="Mes siguiente"
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>

        {loading ? (
          <p className="admin-empty">Cargando calendario...</p>
        ) : (
          <div className="event-calendar">
            {WEEKDAYS.map((weekday) => (
              <div className="calendar-weekday" key={weekday}>{weekday}</div>
            ))}
            {calendarDays.map((day) => {
              const dayEvents = eventsOnDay(day);
              const inCurrentMonth = day.getMonth() === month.getMonth();
              return (
                <div
                  className={`calendar-day${inCurrentMonth ? "" : " outside-month"}`}
                  key={dateKey(day)}
                >
                  <span className="calendar-day-number">{day.getDate()}</span>
                  <div className="calendar-day-events">
                    {dayEvents.map((event) => (
                      <Link
                        className={`calendar-event calendar-event-${event.status}`}
                        key={event._id}
                        to={`/Admin/EventSalesReport/${event._id}`}
                        title={`${event.name} (${event.status})`}
                      >
                        {event.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!loading && events.length === 0 && (
        <p className="admin-empty">Todavía no hay eventos planificados.</p>
      )}

      <section className="admin-panel admin-event-list">
        <h2>Próximos y recientes</h2>
        {events.length > 0 ? (
          <ul>
            {events.map((event) => (
              <li key={event._id}>
                <div>
                  <Link to={`/Admin/EventSalesReport/${event._id}`}>{event.name}</Link>
                  <span>
                    {event.startDate === event.endDate
                      ? event.startDate
                      : `${event.startDate} – ${event.endDate}`}
                  </span>
                </div>
                <span className={`event-status event-status-${event.status}`}>
                  {event.status === "scheduled" ? "Planificado" :
                    event.status === "open" ? "Abierto" :
                      event.status === "closing" ? "Cerrando" : "Cerrado"}
                </span>
                <div className="admin-row-actions">
                  {event.status === "scheduled" && (
                    <>
                      <button
                        className="primary-action"
                        type="button"
                        disabled={Boolean(activeEvent)}
                        onClick={() => handleOpenEvent(event._id)}
                      >
                        Iniciar evento
                      </button>
                      <button
                        className="admin-danger-action"
                        type="button"
                        onClick={() => handleDeleteEvent(event._id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                  {event.status !== "scheduled" && (
                    <Link
                      className="admin-secondary-action"
                      to={`/Admin/EventSalesReport/${event._id}`}
                    >
                      Ver informe
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">Los eventos aparecerán aquí.</p>
        )}
      </section>
    </section>
  );
}

export default InventoryManagement;
