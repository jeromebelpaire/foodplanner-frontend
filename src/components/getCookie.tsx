function getCookie(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

export default getCookie;
