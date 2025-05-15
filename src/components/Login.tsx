import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";

export function Login() {
  const { csrfToken, checkAuthStatus, fetchCsrfToken, authenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nextParam = searchParams.get("next") || "/";

  useEffect(() => {
    if (searchParams.get("signupSuccess") === "true") {
      setMessage("Signup successful! Please log in.");
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (authenticated) {
      navigate(nextParam, { replace: true });
    }
  }, [authenticated, navigate, nextParam]);

  useEffect(() => {
    if (!csrfToken) {
      fetchCsrfToken();
    }
  }, [csrfToken, fetchCsrfToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!csrfToken) {
      setError("CSRF token not available. Please try again.");
      fetchCsrfToken();
      return;
    }

    const trimmedUsername = username.trim();

    fetchFromBackend("/api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ username: trimmedUsername, password }),
    })
      .then((response) => {
        if (response.ok) {
          fetchCsrfToken();
          return response.json();
        }
        return response.json().then((data) => {
          let errorMessage = "Invalid credentials. Please try again.";
          if (data && data.detail) {
            errorMessage = data.detail;
          } else if (data && typeof data === "object") {
            if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
              errorMessage = data.non_field_errors.join(" ");
            } else {
              const firstErrorKey = Object.keys(data)[0];
              if (firstErrorKey && Array.isArray(data[firstErrorKey])) {
                errorMessage = `${firstErrorKey}: ${data[firstErrorKey][0]}`;
              } else {
                errorMessage = JSON.stringify(data);
              }
            }
          }
          throw new Error(errorMessage);
        });
      })
      .then(async () => {
        await checkAuthStatus();
        navigate(nextParam);
      })
      .catch((err) => {
        setError(err.message || "An unexpected error occurred during login.");
        fetchCsrfToken();
      });
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="mb-3 text-center">Login</h2>
          {message && (
            <div className="alert alert-success" role="alert">
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="usernameInput" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="usernameInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="passwordInput" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="passwordInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary" disabled={!csrfToken}>
                Log In
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <p>
              Don't have an account? <Link to="/signup">Sign up here</Link>
            </p>
            <br />
            <p>
              <i> Website is work in progress, thank you for your patience!</i>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
