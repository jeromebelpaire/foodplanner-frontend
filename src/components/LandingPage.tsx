import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Feed from "./Feed"; // Import the Feed component

function LandingPage() {
  const { authenticated, isLoading } = useAuth();

  if (isLoading) {
    // Optionally return a loading indicator here
    return <div>Loading...</div>;
  }

  // Render Feed if authenticated, otherwise redirect to /about
  return authenticated ? <Feed /> : <Navigate to="/about" replace />;
}

export default LandingPage;
