import { Link } from 'react-router-dom';
import { Video, Mail, Github } from 'lucide-react';

/**
 * Global footer displayed on all pages.
 * Matches the dark layout with brand, navigation, features and contact.
 *
 * @returns {JSX.Element} Site footer with sitemap and project details.
 */
export function AppFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand / description */}
          <section
            className="footer-brand"
            aria-label="Información de VideoMeet"
          >
            <div className="footer-brand-title">
              <span className="footer-brand-icon" aria-hidden="true">
                <Video className="brand-icon-svg" aria-hidden="true" />
              </span>
              <span>VideoMeet</span>
            </div>
            <p>
              Plataforma profesional de videoconferencia para colaboración
              remota sin interrupciones.
            </p>
          </section>

          {/* Navigation column */}
          <section aria-label="Navegación principal">
            <h3 className="footer-title">Navegación</h3>
            <ul className="footer-list">
              <li>
                <Link className="footer-link" to="/">
                  Inicio
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/about">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/meetings/new">
                  Reuniones
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/account">
                  Perfil
                </Link>
              </li>
            </ul>
          </section>

          {/* Features column */}
          <section aria-label="Funcionalidades principales">
            <h3 className="footer-title">Funcionalidades</h3>
            <ul className="footer-list">
              <li>Videoconferencia</li>
              <li>Chat en Tiempo Real</li>
              <li>Comunicación por Voz</li>
              <li>Compartir Pantalla</li>
              <li>
                <Link className="footer-link" to="/sitemap">
                  Mapa del Sitio
                </Link>
              </li>
            </ul>
          </section>

          {/* Contact column */}
          <section aria-label="Información de contacto">
            <h3 className="footer-title">Conectar</h3>
            <ul className="footer-list">
              <li>
                <a
                  className="footer-link footer-link-email"
                  href="mailto:support@conferencehub.com"
                >
                  <Mail className="footer-icon" aria-hidden="true" />
                  <span>support@conferencehub.com</span>
                </a>
              </li>
              <li>
                <div className="footer-socials" aria-label="Redes sociales">
                  <a
                    href="https://github.com"
                    className="footer-social-link"
                    aria-label="GitHub"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="footer-icon" aria-hidden="true" />
                  </a>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div className="footer-bottom">
          © 2025 VideoMeet. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
