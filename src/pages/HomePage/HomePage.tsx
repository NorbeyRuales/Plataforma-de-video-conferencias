/**
 * Home / landing page.
 * Presents the platform value proposition and main calls-to-action.
 * GUI-only for Sprint 1 (no real meetings or auth logic yet).
 *
 * @returns {JSX.Element} Landing layout with hero, features and CTA.
 */
import { Link } from 'react-router-dom';
import heroBanner from '../../assets/home-hero-banner.png'; // ajusta la extensión si es distinta
import './HomePage.scss';

export function HomePage(): JSX.Element {
  return (
    <div className="home-page">
      {/* HERO */}
      <section className="hero" aria-labelledby="home-title">
        <div className="container">
          <article className="hero-banner">
            <div className="hero-banner-copy">
              <p className="hero-kicker">
                Videoconferencia profesional hecha simple
              </p>
              <h1 id="home-title" className="hero-title">
                Conecta Tu Equipo En Cualquier Lugar
              </h1>
              <p className="hero-text">
                Organiza reuniones, colabora en tiempo real y mantente conectado
                con tu equipo desde cualquier parte del mundo.
              </p>

              <div className="hero-actions">
                {/* TODO: Wire this CTA to the real sign-up / auth flow */}
                <Link to="/register" className="btn btn-primary">
                  <span>Comenzar Gratis</span>
                </Link>
                <Link to="/about" className="btn btn-dark">
                  <span>Ver cómo funciona</span>
                </Link>
              </div>

              <p className="hero-secondary">
                Sin tarjetas de crédito. Ideal para clases, equipos remotos y
                clientes.
              </p>
            </div>

            <div
              className="hero-banner-media"
              aria-label="Vista previa de una videollamada en VideoMeet"
            >
              <img
                src={heroBanner}
                alt="Persona en una videollamada colaborando con su equipo"
              />
            </div>
          </article>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section
        className="home-features"
        aria-label="Funciones principales de VideoMeet"
      >
        <div className="container">
          <h2 className="section-title">
            Todo Lo Que Necesitas Para Reuniones Efectivas
          </h2>
          <p className="section-subtitle">
            Funcionalidades pensadas para equipos modernos que trabajan en
            remoto.
          </p>

          <div className="features-grid">
            <article className="feature-card">
              <h3>Videoconferencia HD</h3>
              <p>
                Calidad de video cristalina para reuniones profesionales con
                hasta 10 participantes.
              </p>
            </article>

            <article className="feature-card">
              <h3>Chat en Tiempo Real</h3>
              <p>
                Comunícate al instante con mensajes integrados durante la
                videollamada.
              </p>
            </article>

            <article className="feature-card">
              <h3>Comunicación por Voz</h3>
              <p>
                Audio claro con controles de micrófono sencillos y cancelación
                de ruido.
              </p>
            </article>

            <article className="feature-card">
              <h3>Colaboración Fácil</h3>
              <p>
                Comparte enlaces de reunión y une participantes con un solo
                clic.
              </p>
            </article>

            <article className="feature-card">
              <h3>Seguro y Privado</h3>
              <p>
                Cifrado de extremo a extremo para mantener tus conversaciones
                protegidas.
              </p>
            </article>

            <article className="feature-card">
              <h3>Accesible en Cualquier Lugar</h3>
              <p>
                Únete desde cualquier dispositivo, sin instalaciones complejas.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SITEMAP PREVIEW (center block) */}
      <section
        className="home-sitemap-preview"
        aria-label="Mapa del sitio de la plataforma"
      >
        <div className="container">
          <h2 className="section-title">Mapa del Sitio</h2>
          <p className="section-subtitle">Navega nuestra plataforma</p>

          <div className="sitemap-columns">
            <div className="sitemap-column">
              <h3>Páginas Principales</h3>
              <ul>
                <li>
                  <Link to="/">Inicio</Link>
                </li>
                <li>
                  <Link to="/about">Acerca de</Link>
                </li>
                {/* TODO: Replace this with a real /panel route in a future sprint */}
                <li>
                  <Link to="/meetings/new">Panel</Link>
                </li>
              </ul>
            </div>

            <div className="sitemap-column">
              <h3>Cuenta</h3>
              <ul>
                <li>
                  <Link to="/login">Iniciar Sesión</Link>
                </li>
                <li>
                  <Link to="/register">Registrarse</Link>
                </li>
                <li>
                  <Link to="/account">Perfil</Link>
                </li>
                <li>
                  <Link to="/forgot-password">Olvidé mi Contraseña</Link>
                </li>
              </ul>
            </div>

            <div className="sitemap-column">
              <h3>Funcionalidades</h3>
              <ul>
                <li>Crear Reunión</li>
                <li>Unirse a Reunión</li>
                <li>Video Conferencia</li>
                <li>Chat</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP BEFORE FOOTER */}
      <section className="home-cta" aria-label="Llamado a la acción principal">
        <div className="home-cta-inner">
          <p className="home-cta-title">
            ¿Listo Para Transformar Tus Reuniones?
          </p>
          <p className="home-cta-text">
            Únete a miles de equipos que ya están usando VideoMeet.
          </p>
          <Link to="/register" className="btn btn-primary home-cta-button">
            <span>Comenzar Ahora</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
