import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-3 my-4 border-top bg-light">
      <div className="container">
        <ul className="nav justify-content-center border-bottom pb-3 mb-3">
          <li className="nav-item">
            <Link to="/" className="nav-link px-2 text-muted">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link px-2 text-muted">
              About
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/terms-of-service" className="nav-link px-2 text-muted">
              Terms of Service
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/cookie-policy" className="nav-link px-2 text-muted">
              Cookie Policy
            </Link>
          </li>
        </ul>
        <p className="text-center text-muted">© {currentYear} ShareSpice</p>
      </div>
    </footer>
  );
}
