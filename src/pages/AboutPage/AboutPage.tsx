/**
 * About page explaining the idea behind the project and its goals.
 * GUI-only for Sprint 1 (static content, no dynamic data yet).
 *
 * @returns {JSX.Element} Informational page with project context.
 */
import './AboutPage.scss';

export function AboutPage(): JSX.Element {
  return (
    <div className="about-page">
      {/* Hero / intro section */}
      <section
        className="hero-about"
        aria-labelledby="about-title"
      >
        <div className="container hero-about-inner">
          <h1 id="about-title">Acerca de VideoMeet</h1>
          <p className="hero-about-text">
            Estamos en una misión para revolucionar la forma en que los equipos se conectan
            y colaboran remotamente.
          </p>
        </div>
      </section>

      <main className="about-main">
        {/* History + main image */}
        <section
          className="about-section about-history"
          aria-labelledby="history-title"
        >
          <div className="container about-history-grid">
            <article>
              <h2 id="history-title">Nuestra historia</h2>
              <p>
                VideoMeet nació de la necesidad de videoconferencias simples y confiables que
                funcionen para todos. En un mundo donde el trabajo remoto se está convirtiendo
                en la norma, reconocimos los desafíos que enfrentan los equipos para mantenerse
                conectados.
              </p>
              <p>
                Nuestra plataforma combina tecnología de vanguardia con un diseño amigable para
                crear una experiencia que se siente natural y sin esfuerzo. Ya sea que estés
                organizando una reunión rápida con tu equipo o una gran presentación para
                clientes, VideoMeet te tiene cubierto.
              </p>
              <p>
                Estamos comprometidos con la mejora continua, escuchando a nuestros usuarios y
                construyendo funcionalidades que realmente importan. Nuestro objetivo es hacer
                que la distancia sea irrelevante cuando se trata de colaborar.
              </p>
            </article>

            <figure className="about-history-figure">
              <img
                src="https://images.pexels.com/photos/3194519/pexels-photo-3194519.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Persona participando en una videollamada desde su portátil"
              />
            </figure>
          </div>
        </section>

        {/* Values section */}
        <section
          className="about-section about-values"
          aria-labelledby="values-title"
        >
          <div className="container">
            <header className="about-section-header">
              <h2 id="values-title">Nuestros valores</h2>
              <p>Los principios que guían todo lo que hacemos.</p>
            </header>

            <div className="values-grid" role="list">
              <article className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true" />
                <h3>Nuestra misión</h3>
                <p>
                  Hacer que la videoconferencia profesional sea accesible y fácil de usar
                  para equipos de todos los tamaños.
                </p>
              </article>

              <article className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true" />
                <h3>Colaboración en equipo</h3>
                <p>
                  Creemos en el poder de la conexión y la comunicación fluida, incluso cuando
                  cada persona está en un lugar distinto.
                </p>
              </article>

              <article className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true" />
                <h3>Calidad primero</h3>
                <p>
                  Buscamos experiencias de video y audio de alta calidad, con una interfaz
                  clara y confiable para cada reunión.
                </p>
              </article>

              <article className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true" />
                <h3>Enfocados en el usuario</h3>
                <p>
                  Diseñamos funcionalidades que priorizan la experiencia de las personas y la
                  accesibilidad para todos.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Built for modern teams */}
        <section
          className="about-section about-built"
          aria-labelledby="built-title"
        >
          <div className="container about-built-grid">
            <figure className="about-built-figure">
              <img
                src="https://images.pexels.com/photos/1181400/pexels-photo-1181400.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Sala de reuniones preparada para videoconferencias"
              />
            </figure>

            <article>
              <h2 id="built-title">Construido para equipos modernos</h2>
              <ul className="about-built-list">
                <li>
                  <strong>Video y audio HD:</strong> comunicación nítida con tecnología de
                  transmisión optimizada.
                </li>
                <li>
                  <strong>Colaboración en tiempo real:</strong> chatea, comparte pantalla y
                  colabora sin problemas durante las reuniones.
                </li>
                <li>
                  <strong>Seguro y privado:</strong> tus conversaciones están protegidas con
                  buenas prácticas de cifrado y autenticación.
                </li>
                <li>
                  <strong>Diseño accesible:</strong> pensado para que todas las personas
                  puedan participar plenamente.
                </li>
              </ul>
            </article>
          </div>
        </section>

        {/* Technology & security */}
        <section
          className="about-section about-tech"
          aria-labelledby="tech-title"
        >
          <div className="container">
            <header className="about-section-header">
              <h2 id="tech-title">Tecnología y seguridad</h2>
              <p>
                VideoMeet se construye con tecnologías web modernas y buenas prácticas de
                seguridad para brindar una experiencia rápida, confiable y segura.
              </p>
            </header>

            <div className="tech-grid">
              <article className="tech-card">
                <h3>Stack moderno</h3>
                <p>
                  Desarrollado con React, TypeScript y herramientas de tiempo real para lograr
                  rendimiento y mantenibilidad.
                </p>
              </article>

              <article className="tech-card">
                <h3>Comunicación en tiempo real</h3>
                <p>
                  Preparado para WebRTC y Socket.io, permitiendo video, audio y mensajería con
                  baja latencia.
                </p>
              </article>

              <article className="tech-card">
                <h3>Seguridad empresarial</h3>
                <p>
                  Autenticación segura y cifrado de extremo a extremo para ayudar a proteger
                  la información de los usuarios.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA band before footer */}
        <section
          className="about-cta"
          aria-labelledby="cta-title"
        >
          <div className="container about-cta-inner">
            <h2 id="cta-title">¿Listo para transformar tus reuniones?</h2>
            <p>
              Únete a miles de equipos que ya están usando VideoMeet para colaborar a distancia.
            </p>
            <a href="/register" className="btn btn-primary">
              Comenzar ahora
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
