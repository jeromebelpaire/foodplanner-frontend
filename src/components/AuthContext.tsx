import { createContext, useState, useEffect, useContext, useCallback, ReactNode } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { useNavigate } from "react-router-dom";

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

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{
    id: number;
    username: string;
    is_superuser: boolean;
    follower_count: number;
    following_count: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchCsrfToken = useCallback(async () => {
    try {
      const data = await fetchFromBackend("/api/auth/csrf/").then((res) => res.json());
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      setCsrfToken(null);
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
      await fetchCsrfToken();
      if (!csrfToken) return;
    }

    try {
      await fetchFromBackend("/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken!,
        },
      });
      setAuthenticated(false);
      setUser(null);
      setCsrfToken(null);
      await fetchCsrfToken();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [csrfToken, navigate, fetchCsrfToken]);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await fetchCsrfToken();
      await checkAuthStatus();
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchCsrfToken, checkAuthStatus]);

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
}

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
