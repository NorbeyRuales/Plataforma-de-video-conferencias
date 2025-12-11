/**
 * Sitemap page required in Sprint 1.
 * Lists the main routes and briefly describes their purpose.
 *
 * @returns {JSX.Element} Card with a simple sitemap list.
 */
import { Link } from 'react-router-dom';
import './SitemapPage.scss';

/**
 * Sitemap page component.
 * Lists all main sections of the GUI and briefly describes their purpose.
 *
 * @returns {JSX.Element} Sitemap layout rendered as a dashboard card.
 */
export function SitemapPage(): JSX.Element {
  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <section
          className="dashboard-card sitemap-card"
          aria-labelledby="sitemap-title"
        >
          <h1 id="sitemap-title">Mapa del sitio</h1>
          <p className="card-subtitle sitemap-subtitle">
            Navega nuestra plataforma
          </p>

          <div className="sitemap-grid">
            {/* Main pages */}
            <section aria-labelledby="sitemap-main-pages-title">
              <h2
                id="sitemap-main-pages-title"
                className="sitemap-group-title"
              >
                Páginas principales
              </h2>
              <ul className="sitemap-list">
                <li>
                  <Link className="sitemap-link" to="/">
                    Inicio
                  </Link>{' '}
                  — Página de bienvenida con el hero principal.
                </li>
                <li>
                  <Link className="sitemap-link" to="/about">
                  Sobre nosotros
                  </Link>{' '}
                  — Historia y objetivos del proyecto VideoMeet.
                </li>
                <li>
                  {/* Meetings is not a real route yet; descriptive placeholder */}
                  <span className="sitemap-link sitemap-link--plain">
                    Reuniones
                  </span>{' '}
                  — Vista de reuniones (se conectará en sprints posteriores).
                </li>
              </ul>
            </section>

            {/* Account */}
            <section aria-labelledby="sitemap-account-title">
              <h2 id="sitemap-account-title" className="sitemap-group-title">
                Cuenta
              </h2>
              <ul className="sitemap-list">
                <li>
                  <Link className="sitemap-link" to="/login">
                    Iniciar sesión
                  </Link>{' '}
                  — Acceso de usuarios registrados.
                </li>
                <li>
                  <Link className="sitemap-link" to="/register">
                    Registrarse
                  </Link>{' '}
                  — Creación de nuevas cuentas.
                </li>
                <li>
                  <Link className="sitemap-link" to="/account">
                    Perfil
                  </Link>{' '}
                  — Configuración y datos básicos de la cuenta.
                </li>
                <li>
                  <Link className="sitemap-link" to="/forgot-password">
                    Olvidé mi contraseña
                  </Link>{' '}
                  — Recuperación de acceso mediante correo electrónico.
                </li>
              </ul>
            </section>

            {/* Features */}
            <section aria-labelledby="sitemap-features-title">
              <h2
                id="sitemap-features-title"
                className="sitemap-group-title"
              >
                Funcionalidades
              </h2>
              <ul className="sitemap-list">
                <li>
                  <Link className="sitemap-link" to="/meetings/new">
                    Crear reunión
                  </Link>{' '}
                  — Formulario para generar una nueva sala.
                </li>
                <li>
                  <span className="sitemap-link sitemap-link--plain">
                    Unirse a reunión
                  </span>{' '}
                  — Unión a una sala usando un ID (planificado).
                </li>
                <li>
                  <span className="sitemap-link sitemap-link--plain">
                    Video conferencia
                  </span>{' '}
                  — Área de llamada con audio y video.
                </li>
                <li>
                  <span className="sitemap-link sitemap-link--plain">
                    Chat
                  </span>{' '}
                  — Mensajería en tiempo real dentro de la reunión.
                </li>
              </ul>
            </section>
          </div>

          <p className="sitemap-note">
            En Sprint 1 todas las rutas son solo interfaz gráfica (GUI). La
            lógica real de autenticación, creación de reuniones y chat se
            conectará en sprints posteriores.
          </p>
        </section>
      </div>
    </div>
  );
}
