// Tarjeta enlazada a la ficha de detalle de un peluche.
import { Link } from "react-router-dom";

function PlushieCard({ plushie }) {
  // Presenta la imagen, el precio y la disponibilidad del producto.
  return (
    <Link
      className="plushie-card-link"
      to={`/Plushie/${plushie._id}`}
      aria-label={`Ver detalles de ${plushie.name}`}
    >
      <article className="plushie-card">
        {plushie.img ? (
          <img
            className="plushie-card-image"
            src={plushie.img}
            alt={plushie.name}
            loading="lazy"
          />
        ) : (
          <div className="plushie-card-image-placeholder">
            Imagen no disponible
          </div>
        )}

        <div className="plushie-card-info">
          <h3>{plushie.name}</h3>
          <p className="plushie-card-price">
            {Number(plushie.price).toFixed(2)} €
          </p>
          <p className={plushie.availability > 0 ? "stock-in" : "stock-out"}>
            {plushie.availability > 0
              ? `Disponibles: ${plushie.availability}`
              : "Agotado"}
          </p>
        </div>
      </article>
    </Link>
  );
}

export default PlushieCard;
