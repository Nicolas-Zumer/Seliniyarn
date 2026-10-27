// Formulario de registro; al completarlo redirige al inicio de sesión.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    // Comprueba las contraseñas antes de solicitar el alta al backend.
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/users/register", {
        name,
        email,
        password,
      });
      navigate("/Login", { replace: true, state: { registered: true } });
    } catch (error) {
      const message = error.response?.data;
      setError(
        typeof message === "string"
          ? message
          : "No se pudo crear la cuenta. Comprueba la conexión e inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>Crear una cuenta</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </label>

        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Repite la contraseña
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creando cuenta..." : "Registrarse"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      <p>¿Ya tienes cuenta? <Link to="/Login">Iniciar sesión</Link></p>
    </section>
  );
}

export default Register