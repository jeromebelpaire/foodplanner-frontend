// Login.js
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nextParam = searchParams.get("next") || "/";

  // On mount, fetch the CSRF cookie.
  useEffect(() => {
    fetch("http://127.0.0.1:8000/recipes/csrf/", {
      credentials: "include",
    });
  }, []);

  // Helper function to read the csrf token from cookies.
  function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleSubmit = (e: React.ChangeEvent) => {
    e.preventDefault();
    setError("");
    const csrfToken = getCookie("csrftoken");

    fetch("http://127.0.0.1:8000/recipes/login/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then((data) => {
          throw new Error(data.detail || "Invalid credentials");
        });
      })
      .then(() => {
        // On success, redirect to the page the user originally tried to reach.
        navigate(nextParam);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username:{" "}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password:{" "}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

export default Login;
