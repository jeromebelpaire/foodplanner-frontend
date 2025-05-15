import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Feed } from "./Feed";

export function LandingPage() {
  const { authenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return authenticated ? <Feed /> : <Navigate to="/about" replace />;
}
