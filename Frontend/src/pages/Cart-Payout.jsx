// Página del carrito con gestión de cantidades y aviso de pago en desarrollo.
import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

const priceFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function CartPayout() {
  const { cart, updateCartQuantity, removeFromCart } = useOutletContext();
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false);
  const closeButtonRef = useRef(null);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.plushie.price) * item.quantity,
    0
  );

  useEffect(() => {
    // Lleva el foco al diálogo y permite cerrarlo con Escape.
    if (!paymentNoticeOpen) return undefined;
    closeButtonRef.current?.focus();

    function closeOnEscape(event) {
      if (event.key === "Escape") setPaymentNoticeOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [paymentNoticeOpen]);

  return (
    <section className="cart-page">
      <header className="cart-heading">
        <p className="catalog-eyebrow">Tu selección</p>
        <h1>Tu carrito</h1>
      </header>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <p>Tu carrito está vacío.</p>
          <Link className="primary-action" to="/PlushiDisplay">
            Explorar peluches
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items" aria-label="Productos en el carrito">
            {cart.map(({ plushie, quantity }) => (
              <article className="cart-item" key={plushie._id}>
                <Link
                  className="cart-item-image-link"
                  to={`/Plushie/${plushie._id}`}
                  aria-label={`Ver ${plushie.name}`}
                >
                  {plushie.img ? (
                    <img src={plushie.img} alt={plushie.name} />
                  ) : (
                    <span>Sin imagen</span>
                  )}
                </Link>

                <div className="cart-item-details">
                  <Link className="cart-item-name" to={`/Plushie/${plushie._id}`}>
                    {plushie.name}
                  </Link>
                  <p>{plushie.category}</p>
                  <p className="cart-item-price">
                    {priceFormatter.format(Number(plushie.price))}
                  </p>
                  <div className="cart-quantity">
                    <span>Cantidad</span>
                    <button
                      type="button"
                      aria-label={`Reducir cantidad de ${plushie.name}`}
                      onClick={() =>
                        updateCartQuantity(plushie._id, quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Aumentar cantidad de ${plushie.name}`}
                      disabled={quantity >= Number(plushie.availability)}
                      onClick={() =>
                        updateCartQuantity(plushie._id, quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="cart-remove-button"
                    type="button"
                    onClick={() => removeFromCart(plushie._id)}
                  >
                    Eliminar
                  </button>
                </div>

                <p className="cart-line-total">
                  {priceFormatter.format(Number(plushie.price) * quantity)}
                </p>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Resumen del pedido</h2>
            <div className="cart-summary-row">
              <span>Productos ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
              <span>{priceFormatter.format(total)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Envío</span>
              <span>Se calculará más adelante</span>
            </div>
            <div className="cart-summary-total">
              <span>Total parcial</span>
              <span>{priceFormatter.format(total)}</span>
            </div>
            <p className="cart-shipping-note">
              Los gastos de envío se mostrarán antes del pago.
            </p>
            <button
              className="primary-action cart-checkout-button"
              type="button"
              onClick={() => setPaymentNoticeOpen(true)}
            >
              Proceder al pago
            </button>
            <Link className="cart-continue-link" to="/PlushiDisplay">
              Seguir comprando
            </Link>
          </aside>
        </div>
      )}

      {paymentNoticeOpen && (
        <div
          className="payment-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPaymentNoticeOpen(false);
            }
          }}
        >
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            <p className="catalog-eyebrow">Próximamente</p>
            <h2 id="payment-modal-title">Pago en desarrollo</h2>
            <p>
              Esta funcionalidad está en progreso. El pago estará disponible
              próximamente.
            </p>
            <button
              ref={closeButtonRef}
              className="primary-action"
              type="button"
              onClick={() => setPaymentNoticeOpen(false)}
            >
              Entendido
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

export default CartPayout;
