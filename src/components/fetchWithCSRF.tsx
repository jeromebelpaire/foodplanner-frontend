import getCookie from "./getCookie";

export async function fetchWithCSRF(url: string, options: RequestInit = {}) {
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
    await fetch("http://127.0.0.1:8000/recipes/csrf/", { credentials: "include" });
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
