// PrivateRoute.js
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";

export function PrivateRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const nextUrl = location.pathname + location.search;
  const loginUrl = "/login?next=" + encodeURIComponent(nextUrl);
  useEffect(() => {
    // Check authentication status using the session cookie.
    fetchFromBackend("/api/auth/status/", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Once loading is complete, if not authenticated, redirect using React Router.
    if (!loading && !authenticated) {
      navigate(loginUrl, { replace: true });
    }
  }, [loading, authenticated, loginUrl, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If authenticated, render the protected route's content.
  return authenticated ? <Outlet /> : null;
}
