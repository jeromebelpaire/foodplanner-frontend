import getCookie from "./getCookie";

// A helper function that wraps fetch to handle CSRF token expiration.
export async function fetchWithCSRF(url: string, options = {}) {
  // Ensure credentials are included by default.
  const initialcsrfToken = getCookie("csrftoken");
  const defaultOptions = { credentials: "include", headers: { "X-CSRFToken": initialcsrfToken } };
  options = { ...defaultOptions, ...options };

  let response = await fetch(url, options);

  // If the response indicates a CSRF failure, try to refresh the token.
  if (response.status === 403) {
    // Optional: you might want to inspect the response body for a specific CSRF error message.
    // Fetch a new CSRF token from a dedicated endpoint.
    await fetch("http://127.0.0.1:8000/recipes/csrf/", { credentials: "include" });
    // Get the new token from cookies.
    const csrfToken = getCookie("csrftoken");
    // Clone the options and update the CSRF header.
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        "X-CSRFToken": csrfToken,
      },
    };
    // Retry the original request with the new token.
    response = await fetch(url, newOptions);
  }

  return response;
}
