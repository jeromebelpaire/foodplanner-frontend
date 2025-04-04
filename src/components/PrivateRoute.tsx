// PrivateRoute.js
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { fetchWithCSRF } from "./fetchWithCSRF";

export function PrivateRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  const nextUrl = location.pathname + location.search;
  const loginUrl = "/login/?next=" + encodeURIComponent(nextUrl);
  useEffect(() => {
    // Check authentication status using the session cookie.
    fetchWithCSRF("/recipes/auth/status/", { credentials: "include" })
      .then((response) => {
        setAuthenticated(response.ok);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Once loading is complete, if not authenticated, redirect externally.
    if (!loading && !authenticated) {
      window.location.href = loginUrl;
    }
  }, [loading, authenticated, loginUrl]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If authenticated, render the protected route's content.
  return authenticated ? <Outlet /> : null;
}
