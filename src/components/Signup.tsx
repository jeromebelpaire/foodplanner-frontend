import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";

function Signup() {
  const { csrfToken, fetchCsrfToken, authenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate("/");
    }
  }, [authenticated, navigate]);

  useEffect(() => {
    if (!csrfToken) {
      fetchCsrfToken();
    }
  }, [csrfToken, fetchCsrfToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!csrfToken) {
      setError("Cannot submit form. Please try again in a moment.");
      fetchCsrfToken();
      return;
    }

    fetchFromBackend("/api/auth/signup/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({
        username,
        password,
        confirm_password: confirmPassword,
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return response.json().then((data) => {
          let errorMessage = "Signup failed. Please try again.";
          if (data.detail) {
            errorMessage = data.detail;
          } else if (typeof data === "object" && data !== null) {
            // Check for DRF validation errors (field names as keys)
            const firstErrorKey = Object.keys(data)[0];
            if (firstErrorKey && Array.isArray(data[firstErrorKey])) {
              // Combine field name and error message
              errorMessage = `${firstErrorKey
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}: ${data[firstErrorKey][0]}`;
            } else {
              errorMessage = JSON.stringify(data);
            }
          } // Added check for null
          throw new Error(errorMessage);
        });
      })
      .then(() => {
        navigate("/login?signupSuccess=true");
      })
      .catch((err) => {
        setError(err.message || "An unexpected error occurred.");
        fetchCsrfToken();
      });
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="mb-3 text-center">Sign Up</h2>
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
              <label htmlFor="emailInput" className="form-label">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="row mb-3">
              <div className="col">
                <label htmlFor="firstNameInput" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="firstNameInput"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="col">
                <label htmlFor="lastNameInput" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lastNameInput"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
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
                autoComplete="new-password"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPasswordInput" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPasswordInput"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary" disabled={!csrfToken}>
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
