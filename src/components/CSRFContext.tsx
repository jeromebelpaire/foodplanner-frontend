// CSRFContext.js
import { createContext, useContext, useState, useEffect } from "react";

interface CSRFContextType {
  csrfToken: string;
  setCsrfToken: (token: string) => void;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
let csrfRefreshUrl = "/api/auth/csrf/";
if (csrfRefreshUrl.startsWith("/")) {
  csrfRefreshUrl = `${backendUrl}${csrfRefreshUrl}`;
}
const CSRFContext = createContext<CSRFContextType>({
  csrfToken: "",
  setCsrfToken: () => {},
});

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    // Example fetch to get the token once
    async function fetchToken() {
      const res = await fetch(csrfRefreshUrl, { credentials: "include" });
      const data = await res.json();
      setCsrfToken(data.csrfToken);
    }
    fetchToken();
  }, []);

  return (
    <CSRFContext.Provider value={{ csrfToken, setCsrfToken }}>{children}</CSRFContext.Provider>
  );
}

export function useCSRF() {
  return useContext(CSRFContext);
}
