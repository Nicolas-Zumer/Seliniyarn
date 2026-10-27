// Página que carga y filtra los productos de la categoría de la URL.
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import PlushieCard from "../components/PlushieCard";
import SearchBar from "../components/SearchBar";
import api from "../services/api";

function PlushieDisplayCategory() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category")?.trim() ?? "";
  const [plushies, setPlushies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Vuelve a consultar la API cuando cambia la categoría seleccionada.
    const controller = new AbortController();

    async function loadCategory() {
      setLoading(true);
      setError("");
      setPlushies([]);

      if (!category) {
        setError("No se indicó una categoría.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/music/getPlushiesByCategory", {
          params: { category },
          signal: controller.signal,
        });
        if (!Array.isArray(response.data)) {
          throw new Error("La respuesta de productos no es una lista.");
        }
        setPlushies(response.data);
      } catch (requestError) {
        if (!controller.signal.aborted && !axios.isCancel(requestError)) {
          setError("No se pudieron cargar los peluches de esta categoría.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCategory();
    return () => controller.abort();
  }, [category]);

  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filteredPlushies = plushies.filter((plushie) =>
    plushie.name?.toLocaleLowerCase("es").includes(normalizedSearch)
  );

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <p className="catalog-eyebrow">Nuestra colección</p>
        <h1>
          {category === "Normal" ? "Peluches" : `Peluches ${category || ""}`}
        </h1>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar en esta categoría..."
      />

      {loading && <p className="catalog-message">Cargando peluches...</p>}
      {error && <p className="catalog-message catalog-error" role="alert">{error}</p>}

      {!loading && !error && filteredPlushies.length > 0 && (
        <div className="plushie-grid">
          {filteredPlushies.map((plushie) => (
            <PlushieCard key={plushie._id} plushie={plushie} />
          ))}
        </div>
      )}

      {!loading && !error && filteredPlushies.length === 0 && (
        <p className="catalog-message">
          {plushies.length === 0
            ? "Todavía no hay peluches en esta categoría."
            : "No se encontraron peluches con ese nombre."}
        </p>
      )}
    </section>
  );
}

export default PlushieDisplayCategory;
