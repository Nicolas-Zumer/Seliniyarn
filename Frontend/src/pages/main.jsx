// Página principal con productos aleatorios organizados en tres carruseles.
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PlushieSlider from "../components/PlushieSlider";
import api from "../services/api";

const PLUSHIES_PER_SLIDER = 20;
const PLUSHIE_CATEGORIES = ["Pequeño", "Normal", "Mediano", "Grande"];

function chooseRandomProducts(products, limit) {
  // Mezcla una copia de la lista para no alterar el orden recibido del servidor.
  const shuffled = [...products];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, limit);
}

function Main() {
  // Carga el catálogo y gestiona los estados de espera y error.
  const [plushies, setPlushies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

  const plushiesForSlider = useMemo(
    () =>
      chooseRandomProducts(
        plushies.filter((plushie) =>
          PLUSHIE_CATEGORIES.includes(plushie.category)
        ),
        PLUSHIES_PER_SLIDER
      ),
    [plushies]
  );
  const keychainsForSlider = useMemo(
    () =>
      chooseRandomProducts(
        plushies.filter((plushie) => plushie.category === "Llavero"),
        PLUSHIES_PER_SLIDER
      ),
    [plushies]
  );
  const minisForSlider = useMemo(
    () =>
      chooseRandomProducts(
        plushies.filter((plushie) => plushie.category === "Mini"),
        PLUSHIES_PER_SLIDER
      ),
    [plushies]
  );

  return (
    <div className="home-page">
      <section className="home-welcome">
        <p className="catalog-eyebrow">Hechos a mano, con cariño</p>
        <h1>Pequeños peluches, grandes sonrisas</h1>
        <p>
          Descubre peluches y accesorios únicos creados con dedicación por
          Seliniyarn.
        </p>
        <Link className="primary-action" to="/PlushiDisplay">
          Explorar la tienda
        </Link>
      </section>

      {loading && <p className="catalog-message">Cargando nuestras creaciones...</p>}
      {error && <p className="catalog-message catalog-error" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="home-sliders">
          <PlushieSlider
            title="Peluches"
            description="Pequeños, normales, medianos y grandes"
            products={plushiesForSlider}
            sliderId="plushies"
            emptyMessage="Todavía no hay peluches disponibles."
          />
          <PlushieSlider
            title="Llaveros"
            description="Lleva contigo a tu compañero favorito"
            products={keychainsForSlider}
            sliderId="keychains"
            emptyMessage="Todavía no hay llaveros disponibles."
          />
          <PlushieSlider
            title="Minis"
            description="Pequeñas creaciones para coleccionar"
            products={minisForSlider}
            sliderId="minis"
            emptyMessage="Todavía no hay minis disponibles."
          />
        </div>
      )}
    </div>
  );
}

export default Main;
