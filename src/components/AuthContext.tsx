import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { useNavigate } from "react-router-dom";

// Define the shape of the context data
interface AuthContextData {
  csrfToken: string | null;
  isLoading: boolean;
  authenticated: boolean;
  user: {
    id: number;
    username: string;
    is_superuser: boolean;
    follower_count: number;
    following_count: number;
  } | null;
  fetchCsrfToken: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value (can be undefined or a specific shape)
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{
    id: number;
    username: string;
    is_superuser: boolean;
    follower_count: number;
    following_count: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Track initial loading
  const navigate = useNavigate();

  const fetchCsrfToken = useCallback(async () => {
    try {
      const data = await fetchFromBackend("/api/auth/csrf/").then((res) => res.json());
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      setCsrfToken(null); // Ensure token is null on failure
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFromBackend("/api/auth/status/").then((res) => res.json());
      setAuthenticated(data.authenticated);
      setUser(data.authenticated ? data.user : null);
    } catch (error) {
      console.error("Failed to fetch auth status:", error);
      setAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!csrfToken) {
      console.error("CSRF token not available for logout.");
      // Optionally try fetching token again or show error
      await fetchCsrfToken(); // Try fetching again
      if (!csrfToken) return; // Exit if still no token
    }

    try {
      await fetchFromBackend("/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken!, // Assert non-null after check/fetch
        },
      });
      setAuthenticated(false);
      setUser(null);
      setCsrfToken(null); // Clear CSRF token on logout
      await fetchCsrfToken(); // Fetch a new token immediately for login form
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle logout error (e.g., show message to user)
    }
  }, [csrfToken, navigate, fetchCsrfToken]);

  // Fetch CSRF token and check auth status on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await fetchCsrfToken();
      await checkAuthStatus(); // Check status after getting token (or in parallel)
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchCsrfToken, checkAuthStatus]); // Dependencies for initialization logic

  // The value provided to consuming components
  const value = {
    csrfToken,
    isLoading,
    authenticated,
    user,
    fetchCsrfToken,
    checkAuthStatus,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
