/**
 * Fallback 404 page for unknown routes.
 * GUI-only in Sprint 1. Later you can add telemetry or error reporting here.
 *
 * @returns {JSX.Element} Not found message with navigation shortcuts.
 */
import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <section
          className="dashboard-card not-found-card"
          aria-labelledby="not-found-title"
        >
          <div className="not-found-badge" aria-hidden="true">
            404
          </div>

          <h1 id="not-found-title">Página no encontrada</h1>
          <p className="not-found-text">
            La ruta que intentas visitar no existe en VideoMeet o aún no ha sido
            implementada en este sprint.
          </p>

          <div className="not-found-actions">
            <Link to="/" className="btn btn-dark">
              Volver al inicio
            </Link>
            <Link to="/sitemap" className="btn btn-primary">
              Ver mapa del sitio
            </Link>
          </div>

          <p className="not-found-hint">
            Tip: usa el mapa del sitio para navegar a las secciones disponibles
          </p>
        </section>
      </div>
    </div>
  );
}
