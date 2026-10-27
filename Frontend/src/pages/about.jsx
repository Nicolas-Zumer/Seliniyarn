// Página informativa que presenta la historia y el trabajo de Seliniyarn.
function About() {
  return (
    <article className="about-page">
      <header className="about-heading">
        <p className="catalog-eyebrow">Conoce nuestra historia</p>
        <h1>Sobre Seliniyarn</h1>
        <p>
          Una pequeña tienda online de peluches hechos a mano, con cariño y
          dedicación.
        </p>
      </header>

      <div className="about-sections">
        <section className="about-section">
          <span className="about-section-number" aria-hidden="true">01</span>
          <div>
            <h2>Una tienda nacida de una pasión</h2>
            <p>
              Seliniyarn nació del amor de Sel por los peluches y por el trabajo
              artesanal. Después de varios años aprendiendo y practicando
              costura, decidió compartir sus creaciones y empezar a venderlas
              en eventos. Con el tiempo, esa iniciativa se convirtió en una
              tienda online para que sus peluches pudieran llegar a más
              personas.
            </p>
          </div>
        </section>

        <section className="about-section">
          <span className="about-section-number" aria-hidden="true">02</span>
          <div>
            <h2>Diseños propios y compartidos</h2>
            <p>
              En Seliniyarn conviven diseños originales creados por Sel con
              ideas compartidas por artistas y creadores. Algunas personas
              publican patrones gratuitos en plataformas como Pinterest para
              que otros puedan inspirarse y crear. Cada diseño se elige con
              cuidado para transformarlo en un peluche especial.
            </p>
          </div>
        </section>

        <section className="about-section">
          <span className="about-section-number" aria-hidden="true">03</span>
          <div>
            <h2>Hechos a mano, uno a uno</h2>
            <p>
              Cada peluche se elabora a mano, prestando atención a su forma, sus
              detalles y su acabado. Ese proceso artesanal hace que cada pieza
              tenga su propio carácter y que no haya dos exactamente iguales.
              Queremos que cada creación transmita la dedicación puesta en
              hacerla.
            </p>
          </div>
        </section>

        <section className="about-section">
          <span className="about-section-number" aria-hidden="true">04</span>
          <div>
            <h2>Calidad en cada detalle</h2>
            <p>
              Nuestro objetivo es ofrecer peluches suaves, cuidados y hechos
              con atención. Desde la elección del diseño hasta las últimas
              puntadas, buscamos que cada creación sea agradable al tacto y
              especial para quien la recibe. Así, cada peluche puede convertirse
              en un compañero único y lleno de personalidad.
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}

export default About;
