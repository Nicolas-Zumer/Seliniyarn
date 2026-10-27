// Formulario de inicio de sesión conectado al endpoint de autenticación.
import { useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { onLogin } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    // Envía las credenciales y entrega el JWT a la aplicación principal.
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/users/login", { email, password });

      onLogin(response.data);
      const destination = location.state?.from?.pathname ?? "/";
      navigate(destination, { replace: true });
    } catch (error) {
      const message = error.response?.data;
      setError(
        typeof message === "string"
          ? message
          : "No se pudo iniciar sesión. Comprueba la conexión e inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>Iniciar sesión</h2>
      {location.state?.registered && (
        <p role="status">Cuenta creada. Ya puedes iniciar sesión.</p>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      <p>¿No tienes cuenta? <Link to="/Register">Crear una cuenta</Link></p>
    </section>
  );
}

export default Login;