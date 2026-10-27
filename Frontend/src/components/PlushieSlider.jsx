// Carrusel paginado que reutiliza las tarjetas del catálogo.
import { useState } from "react";
import PlushieCard from "./PlushieCard";

const ITEMS_PER_SLIDE = 4;

function PlushieSlider({ title, description, products, sliderId, emptyMessage }) {
  // Muestra cuatro productos por página y calcula los controles disponibles.
  const [currentPage, setCurrentPage] = useState(0);
  const pageCount = Math.ceil(products.length / ITEMS_PER_SLIDE);
  const visibleProducts = products.slice(
    currentPage * ITEMS_PER_SLIDE,
    currentPage * ITEMS_PER_SLIDE + ITEMS_PER_SLIDE
  );

  function goToPage(page) {
    setCurrentPage(Math.max(0, Math.min(page, pageCount - 1)));
  }

  return (
    <section className="home-slider" aria-labelledby={`${sliderId}-title`}>
      <div className="home-slider-heading">
        <div>
          <h2 id={`${sliderId}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
        {pageCount > 1 && (
          <div className="slider-arrows">
            <button
              type="button"
              aria-label={`Página anterior de ${title}`}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={`Página siguiente de ${title}`}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pageCount - 1}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <p className="catalog-message">{emptyMessage}</p>
      ) : (
        <>
          <div className="plushie-grid home-slider-grid">
            {visibleProducts.map((plushie) => (
              <PlushieCard key={plushie._id} plushie={plushie} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="slider-dots" aria-label={`Páginas de ${title}`}>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === currentPage ? "active" : ""}
                  aria-label={`Ir a la página ${index + 1} de ${title}`}
                  aria-current={index === currentPage ? "page" : undefined}
                  onClick={() => goToPage(index)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default PlushieSlider;
