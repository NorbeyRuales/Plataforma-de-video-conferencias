import { useEffect, useState, MouseEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Video, Home, Info, Menu, X } from 'lucide-react';

/**
 * Props for the global application header.
 */
export interface AppHeaderProps {
  /**
   * Whether the current user session is authenticated.
   * TODO: Wire this to real auth state (Context / Firebase).
   */
  isAuthenticated: boolean;
}

/**
 * Top navigation bar displayed across the whole app.
 * It shows slightly different options depending on the auth state.
 *
 * @param {AppHeaderProps} props Component props.
 * @returns {JSX.Element} Sticky site header with primary navigation.
 */
export function AppHeader({ isAuthenticated }: AppHeaderProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close the mobile navigation with Escape and restore focus to the toggle
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        setIsMenuOpen(false);
        const toggleButton = document.querySelector<HTMLButtonElement>(
          '.header-menu-toggle'
        );
        toggleButton?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // When the mobile menu opens, move focus to the first focusable item inside
  useEffect(() => {
    if (!isMenuOpen) return;

    const firstFocusable = document.querySelector<HTMLElement>(
      '.main-nav a, .main-nav button'
    );
    firstFocusable?.focus();
  }, [isMenuOpen]);

  const handleHeaderClick = (event: MouseEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement;

    // Do not steal clicks from links or buttons inside the header
    if (target.closest('a,button')) {
      return;
    }

    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    if (skipLink) {
      skipLink.focus();
      skipLink.click();
    }
  };

  return (
    <header className="site-header">
      <div className="container header-inner" onClick={handleHeaderClick}>
        {/* Brand / logo */}
        <Link to="/" className="brand" aria-label="Ir al inicio de VideoMeet">
          <span className="brand-icon" aria-hidden="true">
            <Video className="brand-icon-svg" aria-hidden="true" />
          </span>
          <span>VideoMeet</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="header-menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={
            isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
          }
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        {/* Primary navigation */}
        <nav
          id="primary-navigation"
          className={`main-nav${isMenuOpen ? ' is-open' : ''}`}
          aria-label="Navegación principal"
        >
          {/* Shared links (public + authenticated) */}
          <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
            <Home className="nav-link-icon" aria-hidden="true" />
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Info className="nav-link-icon" aria-hidden="true" />
            <span>Acerca de</span>
          </NavLink>

          {isAuthenticated ? (
            <>
              {/* Authenticated state: panel + profile + logout */}
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
                onClick={() => {
                  console.log('TODO: logout user');
                }}
                aria-label="Cerrar sesión"
              >
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <>
              {/* Public state: show login + register actions */}
              <NavLink
                to="/login"
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <span>Iniciar sesión</span>
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  navLinkClass(isActive, 'nav-link-cta')
                }
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
 * Utility to compose the className for a navigation link.
 *
 * @param {boolean} isActive Whether the route is currently active.
 * @param {string} [extra] Optional extra class to append.
 * @returns {string} Final className string for the link.
 */
function navLinkClass(isActive: boolean, extra?: string): string {
  const base = 'nav-link';
  const active = isActive ? ' is-active' : '';
  const extraClass = extra ? ` ${extra}` : '';
  return `${base}${active}${extraClass}`;
}
