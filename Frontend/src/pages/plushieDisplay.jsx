// Página del catálogo completo con búsqueda local por nombre.
import { useEffect, useState } from "react";
import axios from "axios";
import PlushieCards from "../components/PlushieCards";
import SearchBar from "../components/SearchBar";
import api from "../services/api";

function PlushieDisplay() {
  const [plushies, setPlushies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Solicita el catálogo y cancela la petición si se abandona la página.
    const controller = new AbortController();

    async function loadPlushies() {
      try {
        const response = await api.get("/music/getPlushie", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data)) {
          throw new Error("La respuesta de productos no es una lista.");
        }
        setPlushies(response.data);
      } catch (requestError) {
        if (!controller.signal.aborted && !axios.isCancel(requestError)) {
          setError("No se pudieron cargar los peluches.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPlushies();
    return () => controller.abort();
  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filteredPlushies = plushies.filter((plushie) =>
    plushie.name?.toLocaleLowerCase("es").includes(normalizedSearch)
  );

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <p className="catalog-eyebrow">Encuentra tu próximo compañero</p>
        <h1>Todos nuestros peluches</h1>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {loading && <p className="catalog-message">Cargando peluches...</p>}
      {error && <p className="catalog-message catalog-error" role="alert">{error}</p>}

      {!loading && !error && (
        <PlushieCards plushies={filteredPlushies} />
      )}
    </section>
  );
}

export default PlushieDisplay;
