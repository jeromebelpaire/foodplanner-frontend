// PrivateRoute.js
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import { fetchFromBackend } from "./fetchFromBackend"; // No longer needed here
import { useAuth } from "./AuthContext"; // Import useAuth

export function PrivateRoute() {
  const { isLoading, authenticated } = useAuth(); // Use context state
  const location = useLocation();
  const navigate = useNavigate();

  const nextUrl = location.pathname + location.search;
  const loginUrl = "/login?next=" + encodeURIComponent(nextUrl);

  useEffect(() => {
    // No need to fetch here, context handles it.
    // Redirect logic remains the same, but relies on context state.
    if (!isLoading && !authenticated) {
      navigate(loginUrl, { replace: true });
    }
  }, [isLoading, authenticated, loginUrl, navigate]);

  if (isLoading) {
    // Use the loading state from context
    return <div>Loading...</div>;
  }

  // If authenticated (checked by context), render the protected route's content.
  // Otherwise, the useEffect above will handle the redirect.
  return authenticated ? <Outlet /> : null;
  // Return null while redirecting or if loading finished and still not authenticated
}
