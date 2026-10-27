// Página de contacto con datos de la tienda y formulario de demostración local.
import { useState } from "react";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  comment: "",
};

function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setSubmitted(false);
  }

  function handleSubmit(event) {
    // El formulario aún no envía datos; limpia los campos y confirma el envío.
    event.preventDefault();
    setForm(INITIAL_FORM);
    setSubmitted(true);
  }

  return (
    <section className="contact-page">
      <header className="contact-heading">
        <p className="catalog-eyebrow">Estamos aquí para ayudarte</p>
        <h1>Contacto</h1>
        <p>¿Tienes alguna pregunta? Escríbenos y estaremos encantados de ayudarte.</p>
      </header>

      <div className="contact-layout">
        <section className="contact-details" aria-labelledby="contact-details-title">
          <h2 id="contact-details-title">Contacta con Seliniyarn</h2>
          <div className="contact-detail-group">
            <h3>Email</h3>
            <a href="mailto:seliniyarn@seliniyarn.es">
              seliniyarn@seliniyarn.es
            </a>
          </div>

          <div className="contact-detail-group">
            <h3>Redes sociales</h3>
            <ul className="contact-social-links">
              <li>
                <span aria-hidden="true" className="social-icon">◎</span>
                <a
                  href="https://www.instagram.com/seliniyarn/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              </li>
              <li>
                <span aria-hidden="true" className="social-icon">♪</span>
                <a
                  href="https://www.tiktok.com/@seliniyarn"
                  target="_blank"
                  rel="noreferrer"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>

          <p className="contact-note">
            El formulario no esta disponible de momento; por ahora sirve como
            demostración y limpia los campos al enviarlo.
          </p>
        </section>

        <section className="contact-form-panel" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">Envíanos un mensaje</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <label>
                Nombre
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </label>

              <label>
                Email <span aria-hidden="true">*</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <label>
              Número de teléfono
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </label>

            <label>
              Comentario
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                rows="5"
              />
            </label>

            <button className="primary-action" type="submit">
              Enviar
            </button>
            {submitted && (
              <p className="contact-success" role="status">
                Formulario enviado. Gracias por contactar con nosotros.
              </p>
            )}
          </form>
        </section>
      </div>
    </section>
  );
}

export default Contact;
