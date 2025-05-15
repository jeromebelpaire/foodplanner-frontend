export async function fetchFromBackend(url: string, options: RequestInit = {}) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  if (url.startsWith("/")) {
    url = `${backendUrl}${url}`;
  }

  //TODO review
  const newOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  };

  const response = await fetch(url, newOptions);

  return response;
}
