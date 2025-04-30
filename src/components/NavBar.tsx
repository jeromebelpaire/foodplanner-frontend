import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";

function NavBar() {
  const { authenticated, logout, isLoading, user } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed from NavBar:", error);
    }
  };

  if (isLoading) {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark dark-navbar">
        <div className="container-fluid">
          <span className="navbar-brand">ShareSpice</span>
          <span className="navbar-text ms-auto">Loading...</span>
        </div>
      </nav>
    );
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark dark-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            ShareSpice
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Explore Recipes
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/about">
                  About
                </Link>
              </li>
              {authenticated && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/grocery-lists">
                      My Shopping Lists
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/recipes">
                      My Recipes
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/feed">
                      Feed
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              {authenticated ? (
                <>
                  {user && <span className="navbar-text me-3">Welcome, {user.username}!</span>}
                  <li className="nav-item">
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/signup">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
