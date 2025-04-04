// CSRFContext.js
import { createContext, useContext, useState, useEffect } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
let csrfRefreshUrl = "/recipes/csrf/";
if (csrfRefreshUrl.startsWith("/")) {
  csrfRefreshUrl = `${backendUrl}${csrfRefreshUrl}`;
}
const CSRFContext = createContext({ csrfToken: "" });

export function CSRFProvider({ children }) {
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
