import { useEffect, useState, MouseEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Video, Home, Info, Menu, X } from 'lucide-react';
import { setAuthToken } from '../../services/authToken';

export interface AppHeaderProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
}

/**
 * Global site header with primary navigation and auth controls.
 *
 * @param {AppHeaderProps} props Authentication state and logout handler.
 * @returns {JSX.Element} Sticky header with responsive menu.
 */
export function AppHeader({ isAuthenticated, onLogout }: AppHeaderProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        setIsMenuOpen(false);
        document.querySelector<HTMLButtonElement>('.header-menu-toggle')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    document.querySelector<HTMLElement>('.main-nav a, .main-nav button')?.focus();
  }, [isMenuOpen]);

  const handleHeaderClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('a,button')) return;
    document.querySelector<HTMLAnchorElement>('.skip-link')?.click();
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      setAuthToken(null);
      window.location.href = '/login';
    }
  };

  return (
    <header className="site-header">
      <div className="container header-inner" onClick={handleHeaderClick}>
        <Link to="/" className="brand" aria-label="Ir al inicio de VideoMeet">
          <span className="brand-icon" aria-hidden="true">
            <Video className="brand-icon-svg" aria-hidden="true" />
          </span>
          <span>VideoMeet</span>
        </Link>

        <button
          type="button"
          className="header-menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          id="primary-navigation"
          className={`main-nav${isMenuOpen ? ' is-open' : ''}`}
          aria-label="Navegación principal"
        >
          <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
            <Home className="nav-link-icon" aria-hidden="true" />
            <span>Inicio</span>
          </NavLink>

          <NavLink to="/about" className={({ isActive }) => navLinkClass(isActive)}>
            <Info className="nav-link-icon" aria-hidden="true" />
            <span>Sobre nosotros</span>
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/meetings/new"
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span>Panel</span>
              </NavLink>

              <NavLink
                to="/account"
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span>Perfil</span>
              </NavLink>

              <button
                type="button"
                className="nav-link nav-link-cta nav-link-button"
                onClick={handleLogoutClick}
                aria-label="Cerrar sesión"
              >
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => navLinkClass(isActive)}>
                <span>Iniciar sesión</span>
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) => navLinkClass(isActive, 'nav-link-cta')}
              >
                <span>Registrarse</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/**
 * Compose navigation link classes with optional active and extra modifiers.
 *
 * @param {boolean} isActive Whether the link matches the current route.
 * @param {string} [extra] Optional additional class names.
 * @returns {string} Final class list.
 */
function navLinkClass(isActive: boolean, extra?: string): string {
  const base = 'nav-link';
  const active = isActive ? ' is-active' : '';
  const extraClass = extra ? ` ${extra}` : '';
  return `${base}${active}${extraClass}`;
}
