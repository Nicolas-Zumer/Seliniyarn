// Agrupa las tarjetas del catálogo por categoría y ofrece acceso a cada listado.
import { Link } from "react-router-dom";
import PlushieCard from "./PlushieCard";

function PlushieCards({ plushies, previewLimit = 5 }) {
  // Calcula las categorías disponibles y muestra una selección por cada una.
  const categories = [...new Set(plushies.map((plushie) => plushie.category))];

  if (categories.length === 0) {
    return <p>No hay peluches que coincidan con la búsqueda.</p>;
  }

  return (
    <div className="plushie-categories">
      {categories.map((category) => {
        const categoryPlushies = plushies
          .filter((plushie) => plushie.category === category)
          .slice(0, previewLimit);

        return (
          <section className="plushie-category" key={category}>
            <div className="plushie-category-heading">
              <h2>{category === "Normal" ? "Peluches" : `Peluches ${category}`}</h2>
              <Link
                className="show-more-link"
                to={`/PlushieDisplayCategory?category=${encodeURIComponent(category)}`}
              >
                Mostrar más
              </Link>
            </div>
            <div className="plushie-grid">
              {categoryPlushies.map((plushie) => (
                <PlushieCard key={plushie._id} plushie={plushie} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default PlushieCards;
