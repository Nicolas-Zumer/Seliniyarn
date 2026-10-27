// Contenedor principal: mantiene la sesión, el tema, el carrito y la navegación.
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./App.css";
import logo from "./assets/logo.jpg";
import api from "./services/api";

function App() {
  // Recupera el tema, la sesión y el carrito persistidos en el navegador.
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "dark" ? "dark" : "light";
  });
  const [user, setUser] = useState(() => {
    try {
      if (!localStorage.getItem("token")) {
        localStorage.removeItem("user");
        return null;
      }
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsedCart)
        ? parsedCart.filter(
            (item) =>
              item?.plushie?._id &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0
          )
        : [];
    } catch {
      return [];
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();

  // Aplica el tema y persiste los cambios del carrito.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Añade un producto al carrito respetando el stock informado.
  function addToCart(plushie) {
    const stock = Number(plushie.availability);
    if (!plushie._id || !Number.isFinite(stock) || stock < 1) return;

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.plushie._id === plushie._id
      );

      if (!existingItem) {
        return [...currentCart, { plushie, quantity: 1 }];
      }

      return currentCart.map((item) =>
        item.plushie._id === plushie._id
          ? {
              plushie,
              quantity: Math.min(item.quantity + 1, stock),
            }
          : item
      );
    });
  }

  // Actualiza o elimina una línea del carrito según la cantidad solicitada.
  function updateCartQuantity(plushieId, quantity) {
    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity)) return;
    if (requestedQuantity < 1) {
      removeFromCart(plushieId);
      return;
    }

    setCart((currentCart) => {
      const currentItem = currentCart.find(
        (item) => item.plushie._id === plushieId
      );
      if (!currentItem) return currentCart;

      const stock = Number(currentItem.plushie.availability);
      if (!Number.isFinite(stock) || stock < 1) {
        return currentCart.filter((item) => item.plushie._id !== plushieId);
      }

      return currentCart.map((item) =>
        item.plushie._id === plushieId
          ? { ...item, quantity: Math.min(requestedQuantity, stock) }
          : item
      );
    });
  }

  function removeFromCart(plushieId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.plushie._id !== plushieId)
    );
  }

  // Guarda la sesión recibida tras iniciar sesión.
  function handleLogin({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    setMenuOpen(false);
  }

  // Cierra la sesión local y vuelve a la página principal.
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    setAccountError("");
    navigate("/", { replace: true });
  }

  // Solicita al backend el borrado de la cuenta autenticada.
  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "¿Seguro que quieres borrar tu cuenta? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token || !user?._id) {
      setAccountError("No se ha encontrado una sesión válida. Inicia sesión de nuevo.");
      return;
    }

    setDeletingAccount(true);
    setAccountError("");
    try {
      await api.delete(`/users/deleteUser/${user._id}`);
      handleLogout();
    } catch (error) {
      const message = error.response?.data;
      setAccountError(
        typeof message === "string"
          ? message
          : "No se pudo borrar la cuenta. Inténtalo de nuevo."
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  // Cierra el menú de cuenta al hacer clic fuera o pulsar Escape.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleOutletLogin(payload) {
    handleLogin(payload);
  }

  // Estructura compartida por todas las páginas de la aplicación.
  return (
    <div className='App'>
      <header className="site-header">
        <h1>Seliniyarn</h1>
        <p>Peluches hechos con cariño</p>
      </header>
      <div className="navigation-wrap">
        <nav className="site-navigation" aria-label="Navegación principal">
          <div className="brand-admin-group">
            <NavLink className="brand-link" to="" aria-label="Seliniyarn, inicio">
              <img src={logo} alt="Seliniyarn" />
            </NavLink>

            {user?.rol === "admin" && (
              <NavLink className="admin-link" to="/Admin/InventoryManagement">
                Administración
              </NavLink>
            )}
          </div>
          <NavLink to=""> Home </NavLink>
          <NavLink to="PlushiDisplay"> Plushies </NavLink>
          {user ? (
            <div className="account-menu" ref={accountMenuRef}>
              <button
                className="account-menu-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((open) => !open);
                  setAccountError("");
                }}
              >
                {user.name}
              </button>
              {menuOpen && (
                <div className="account-menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="delete-account-button"
                    disabled={deletingAccount}
                    onClick={handleDeleteAccount}
                  >
                    {deletingAccount ? "Borrando cuenta..." : "Borrar cuenta"}
                  </button>
                  {accountError && <p role="alert">{accountError}</p>}
                </div>
              )}
            </div>
          ) : (
            <NavLink to="Login">Sign in</NavLink>
          )}
          <NavLink to="CartPayout">
            Carrito{cart.length > 0 && ` (${cart.reduce((total, item) => total + item.quantity, 0)})`}
          </NavLink>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            aria-label={`Cambiar a tema ${theme === "light" ? "oscuro" : "claro"}`}
            title={`Cambiar a tema ${theme === "light" ? "oscuro" : "claro"}`}
          >
            {theme === "light" ? "🌙" : "☀️"}
            <span>{theme === "light" ? "Oscuro" : "Claro"}</span>
          </button>
        </nav>
      </div>
      <main>
        <Outlet
          context={{
            user,
            onLogin: handleOutletLogin,
            cart,
            addToCart,
            updateCartQuantity,
            removeFromCart,
          }}
        />
      </main>
      <footer className="site-footer">
        <p className="copyright-notice">&copy; 2026 Seliniyarn.com. All rights reserved.</p>
        <div className="footer-links">
          <NavLink to="About"> About us </NavLink>
          <NavLink to="Contact"> Contact </NavLink>
        </div>
      </footer>
    </div>
  )
}

export default App
