// Ficha de detalle del producto, con disponibilidad y acción para el carrito.
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useOutletContext, useParams } from "react-router-dom";
import api from "../services/api";

const priceFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function Plushie() {
  const { id } = useParams();
  const { addToCart } = useOutletContext();
  const [plushie, setPlushie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    // Obtiene el producto solicitado y cancela la petición al salir.
    const controller = new AbortController();

    async function loadPlushie() {
      setLoading(true);
      setError("");
      setPlushie(null);
      setAddedToCart(false);

      try {
        const response = await api.get(`/music/${id}`, {
          signal: controller.signal,
        });
        setPlushie(response.data);
      } catch (requestError) {
        if (!controller.signal.aborted && !axios.isCancel(requestError)) {
          setError(
            requestError.response?.status === 404
              ? "No se encontró este peluche."
              : "No se pudo cargar el peluche. Inténtalo de nuevo."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPlushie();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <p className="catalog-message">Cargando peluche...</p>;
  }

  if (error || !plushie) {
    return (
      <section className="catalog-page">
        <p className="catalog-message catalog-error" role="alert">
          {error || "No se encontró este peluche."}
        </p>
        <p className="catalog-message">
          <Link to="/PlushiDisplay">Volver a los peluches</Link>
        </p>
      </section>
    );
  }

  const inStock = Number(plushie.availability) > 0;

  function handleAddToCart() {
    addToCart(plushie);
    setAddedToCart(true);
  }

  return (
    <section className="catalog-page">
      <p className="product-breadcrumb">
        <Link to="/PlushiDisplay">Peluches</Link>
        <span aria-hidden="true"> / </span>
        {plushie.category}
      </p>

      <article className="product-detail">
        <div className="product-detail-image-wrap">
          {plushie.img ? (
            <img className="product-detail-image" src={plushie.img} alt={plushie.name} />
          ) : (
            <div className="product-detail-image-placeholder">
              Imagen no disponible
            </div>
          )}
        </div>

        <div className="product-detail-content">
          <p className="catalog-eyebrow">{plushie.category}</p>
          <h1>{plushie.name}</h1>
          <p className="product-detail-price">
            {priceFormatter.format(Number(plushie.price))}
          </p>

          <div className="product-basic-info">
            <p>
              <strong>Colección:</strong> {plushie.collection1 || "Sin colección"}
            </p>
            <p className={inStock ? "stock-in" : "stock-out"}>
              {inStock ? `Disponibles: ${plushie.availability}` : "Agotado"}
            </p>
          </div>

          <details className="product-specifications">
            <summary>Ver características completas</summary>
            <dl>
              <div><dt>Categoría</dt><dd>{plushie.category}</dd></div>
              <div><dt>Colección</dt><dd>{plushie.collection1 || "No especificada"}</dd></div>
              <div><dt>Color</dt><dd>{plushie.color || "No especificado"}</dd></div>
              <div><dt>Altura</dt><dd>{plushie.height ?? "No especificada"}</dd></div>
              <div><dt>Anchura</dt><dd>{plushie.width ?? "No especificada"}</dd></div>
              <div><dt>Peso</dt><dd>{plushie.Weight ?? "No especificado"}</dd></div>
              <div><dt>Disponibilidad</dt><dd>{plushie.availability}</dd></div>
            </dl>
          </details>

          <button
            className="primary-action product-add-button"
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? "Añadir al carrito" : "Agotado"}
          </button>
          {addedToCart && (
            <p className="cart-feedback" role="status">
              Peluche añadido al carrito.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}

export default Plushie;
