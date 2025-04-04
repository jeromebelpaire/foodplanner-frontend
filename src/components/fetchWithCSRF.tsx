import getCookie from "./getCookie";

export async function fetchFromBackend(url: string, options: RequestInit = {}) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  // If the input URL is relative, prepend the backend URL.
  if (url.startsWith("/")) {
    url = `${backendUrl}${url}`;
  }

  const initialcsrfToken = getCookie("csrftoken") ?? "";
  //TODO review
  const newOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      "X-CSRFToken": initialcsrfToken,
    },
  };

  let response = await fetch(url, newOptions);

  // If the response indicates a CSRF failure, try to refresh the token.
  if (response.status === 403) {
    let csrfRefreshUrl = "/recipes/csrf/";
    if (csrfRefreshUrl.startsWith("/")) {
      csrfRefreshUrl = `${backendUrl}${csrfRefreshUrl}`;
    }
    await fetch(csrfRefreshUrl, { credentials: "include" });
    const csrfToken = getCookie("csrftoken") ?? "";
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        "X-CSRFToken": csrfToken,
      },
    };
    response = await fetch(url, newOptions);
  }

  return response;
}
