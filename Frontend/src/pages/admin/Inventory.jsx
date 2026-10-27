// Inventario: consulta, alta, edición y eliminación de productos.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const EMPTY_PRODUCT = {
  name: "",
  category: "",
  collection1: "",
  color: "",
  price: "",
  availability: "",
  height: "",
  width: "",
  Weight: "",
  img: "",
};

const PRICE_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function toProductPayload(form) {
  return {
    ...form,
    price: Number(form.price),
    availability: Number(form.availability),
    height: form.height === "" ? undefined : Number(form.height),
    width: form.width === "" ? undefined : Number(form.width),
    Weight: form.Weight === "" ? undefined : Number(form.Weight),
  };
}

function Inventory() {
  const [plushies, setPlushies] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_PRODUCT);
  const [newForm, setNewForm] = useState(EMPTY_PRODUCT);
  const [showNewForm, setShowNewForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPlushies = useCallback(async () => {
    try {
      const response = await api.get("/music/getPlushie");
      if (!Array.isArray(response.data)) {
        throw new Error("La respuesta del catálogo no es válida.");
      }
      setPlushies(response.data);
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : requestError.message || "No se pudo cargar el inventario."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/music/getPlushie")
      .then((response) => {
        if (!Array.isArray(response.data)) {
          throw new Error("La respuesta del catálogo no es válida.");
        }
        if (active) setPlushies(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            typeof requestError.response?.data === "string"
              ? requestError.response.data
              : requestError.message || "No se pudo cargar el inventario."
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

  function startEditing(plushie) {
    setEditingId(plushie._id);
    setEditForm({
      name: plushie.name ?? "",
      category: plushie.category ?? "",
      collection1: plushie.collection1 ?? "",
      color: plushie.color ?? "",
      price: String(plushie.price ?? ""),
      availability: String(plushie.availability ?? ""),
      height: plushie.height == null ? "" : String(plushie.height),
      width: plushie.width == null ? "" : String(plushie.width),
      Weight: plushie.Weight == null ? "" : String(plushie.Weight),
      img: plushie.img ?? "",
    });
    setError("");
    setSuccess("");
  }

  async function handleUpdate(event, plushieId) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(
        `/music/updatePlushie/${plushieId}`,
        toProductPayload(editForm)
      );
      setEditingId("");
      setSuccess("Producto actualizado.");
      await loadPlushies();
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo actualizar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/music/addPlushie", toProductPayload(newForm));
      setNewForm(EMPTY_PRODUCT);
      setShowNewForm(false);
      setSuccess("Producto añadido al inventario.");
      await loadPlushies();
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo añadir el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plushie) {
    if (!window.confirm(`¿Quieres eliminar «${plushie.name}» del catálogo?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/music/deletePlushie/${plushie._id}`);
      setSuccess("Producto eliminado.");
      await loadPlushies();
    } catch (requestError) {
      setError(
        typeof requestError.response?.data === "string"
          ? requestError.response.data
          : "No se pudo eliminar el producto."
      );
    }
  }

  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filteredPlushies = plushies.filter((plushie) =>
    [
      plushie.name,
      plushie.category,
      plushie.collection1,
      plushie.color,
    ].some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch))
  );
  const categories = [...new Set(filteredPlushies.map((plushie) => plushie.category))].sort();
  const totalUnits = plushies.reduce(
    (total, plushie) => total + Number(plushie.availability || 0),
    0
  );
  const totalValue = plushies.reduce(
    (total, plushie) =>
      total + Number(plushie.price || 0) * Number(plushie.availability || 0),
    0
  );
  const valueByCategory = plushies.reduce((totals, plushie) => {
    const category = plushie.category;
    totals.set(
      category,
      (totals.get(category) || 0) +
        Number(plushie.price || 0) * Number(plushie.availability || 0)
    );
    return totals;
  }, new Map());

  function getCategoryLabel(category) {
    const labels = {
      Pequeño: "Peluches pequeños",
      Normal: "Peluches normales",
      Mediano: "Peluches medianos",
      Grande: "Peluches grandes",
      Llavero: "Llaveros",
      Mini: "Minis",
    };
    return labels[category] || `Peluches ${category.toLocaleLowerCase("es")}`;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="catalog-eyebrow">Panel de administración</p>
          <h1>Inventario</h1>
          <p className="admin-page-description">
            {plushies.length} referencias · {totalUnits} unidades disponibles ·
            {" "}{PRICE_FORMATTER.format(totalValue)} en stock a precio de venta
          </p>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-secondary-action" to="/Admin/InventoryManagement">
            Calendario de eventos
          </Link>
          <button
            className="primary-action"
            type="button"
            onClick={() => setShowNewForm((visible) => !visible)}
          >
            {showNewForm ? "Cancelar" : "Añadir producto"}
          </button>
        </div>
      </header>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}

      <section className="admin-panel inventory-value-panel" aria-label="Valor del inventario">
        <div className="inventory-value-heading">
          <div>
            <p className="catalog-eyebrow">Valor del inventario actual</p>
            <h2>Dinero en peluches en stock</h2>
          </div>
          <strong className="inventory-total-value">
            {PRICE_FORMATTER.format(totalValue)}
          </strong>
        </div>
        {valueByCategory.size > 0 ? (
          <ul className="inventory-value-list">
            {[...valueByCategory.entries()]
              .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB, "es"))
              .map(([category, value]) => (
                <li key={category}>
                  <span>{getCategoryLabel(category)}</span>
                  <strong>{PRICE_FORMATTER.format(value)}</strong>
                </li>
              ))}
            <li className="inventory-value-total">
              <span>Total</span>
              <strong>{PRICE_FORMATTER.format(totalValue)}</strong>
            </li>
          </ul>
        ) : (
          <p className="admin-empty">No hay productos en stock.</p>
        )}
      </section>

      <label className="inventory-search">
        <span>Buscar un peluche para consultar o editar</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, color, colección o categoría..."
        />
      </label>

      {showNewForm && (
        <form className="admin-panel inventory-product-form" onSubmit={handleCreate}>
          <h2>Nuevo producto</h2>
          <ProductFields
            form={newForm}
            onChange={(field, value) =>
              setNewForm((current) => ({ ...current, [field]: value }))
            }
          />
          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="admin-empty">Cargando inventario...</p>
      ) : plushies.length === 0 ? (
        <p className="admin-empty">Todavía no hay productos en el inventario.</p>
      ) : filteredPlushies.length === 0 ? (
        <p className="admin-empty">
          No se encontraron peluches para «{search}».
        </p>
      ) : (
        <div className="inventory-categories">
          {categories.map((category) => (
            <section className="admin-panel inventory-category" key={category}>
              <h2>{getCategoryLabel(category)}</h2>
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">Colección</th>
                      <th scope="col">Precio</th>
                      <th scope="col">Stock</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlushies.filter((plushie) => plushie.category === category).map((plushie) => (
                      <tr key={plushie._id}>
                        <td>
                          <strong>{plushie.name}</strong>
                          {plushie.color && <span className="inventory-subtext">{plushie.color}</span>}
                        </td>
                        <td>{plushie.collection1 || "—"}</td>
                        <td>{PRICE_FORMATTER.format(Number(plushie.price))}</td>
                        <td>
                          <span className={`inventory-stock${plushie.availability < 1 ? " inventory-stock-empty" : ""}`}>
                            {plushie.availability}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="admin-secondary-action"
                              type="button"
                              onClick={() => startEditing(plushie)}
                            >
                              Editar
                            </button>
                            <button
                              className="admin-danger-action"
                              type="button"
                              onClick={() => handleDelete(plushie)}
                            >
                              Eliminar
                            </button>
                          </div>
                          {editingId === plushie._id && (
                            <form
                              className="inventory-inline-editor"
                              onSubmit={(event) => handleUpdate(event, plushie._id)}
                            >
                              <ProductFields
                                form={editForm}
                                onChange={(field, value) =>
                                  setEditForm((current) => ({ ...current, [field]: value }))
                                }
                              />
                              <div className="admin-row-actions">
                                <button className="primary-action" type="submit" disabled={saving}>
                                  {saving ? "Guardando..." : "Guardar cambios"}
                                </button>
                                <button
                                  className="admin-secondary-action"
                                  type="button"
                                  onClick={() => setEditingId("")}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductFields({ form, onChange }) {
  return (
    <div className="inventory-fields">
      <label>
        Nombre
        <input required value={form.name} onChange={(event) => onChange("name", event.target.value)} />
      </label>
      <label>
        Categoría
        <input required value={form.category} onChange={(event) => onChange("category", event.target.value)} />
      </label>
      <label>
        Colección
        <input required value={form.collection1} onChange={(event) => onChange("collection1", event.target.value)} />
      </label>
      <label>
        Color
        <input value={form.color} onChange={(event) => onChange("color", event.target.value)} />
      </label>
      <label>
        Precio (€)
        <input type="number" min="0" step="0.01" required value={form.price} onChange={(event) => onChange("price", event.target.value)} />
      </label>
      <label>
        Unidades disponibles
        <input type="number" min="0" step="1" required value={form.availability} onChange={(event) => onChange("availability", event.target.value)} />
      </label>
      <label>
        Altura (cm)
        <input type="number" min="0" step="0.1" value={form.height} onChange={(event) => onChange("height", event.target.value)} />
      </label>
      <label>
        Anchura (cm)
        <input type="number" min="0" step="0.1" value={form.width} onChange={(event) => onChange("width", event.target.value)} />
      </label>
      <label>
        Peso (g)
        <input type="number" min="0" step="0.1" value={form.Weight} onChange={(event) => onChange("Weight", event.target.value)} />
      </label>
      <label className="inventory-image-field">
        URL de imagen
        <input type="url" value={form.img} onChange={(event) => onChange("img", event.target.value)} />
      </label>
    </div>
  );
}

export default Inventory;
