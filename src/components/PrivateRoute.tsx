// PrivateRoute.js
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function PrivateRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  // Build the external login URL with a `next` parameter (make sure your Django login view supports it)
  const nextUrl = window.location.origin + location.pathname + location.search;
  // Build the external login URL with the next parameter set to the full frontend URL
  const loginUrl = "http://127.0.0.1:8000/accounts/login/?next=" + encodeURIComponent(nextUrl);
  //FIXME login page should also be react to leave behind port issues

  useEffect(() => {
    // Check authentication status using the session cookie.
    fetch("http://127.0.0.1:8000/recipes/auth/status/", { credentials: "include" })
      .then((response) => {
        if (response.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
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
