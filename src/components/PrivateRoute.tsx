import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function PrivateRoute() {
  const { isLoading, authenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nextUrl = location.pathname + location.search;
  const loginUrl = "/login?next=" + encodeURIComponent(nextUrl);

  useEffect(() => {
    if (!isLoading && !authenticated) {
      navigate(loginUrl, { replace: true });
    }
  }, [isLoading, authenticated, loginUrl, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return authenticated ? <Outlet /> : null;
}
