// Login.js
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";

function Login() {
  const { csrfToken } = useCSRF();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nextParam = searchParams.get("next") || "/";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    fetchFromBackend("/api/auth/login/", {
      method: "POST",
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
