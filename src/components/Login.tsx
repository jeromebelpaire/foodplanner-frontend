import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";

function Login() {
  const { csrfToken, checkAuthStatus, fetchCsrfToken, authenticated } = useAuth(); // Use new hook
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // For success messages like from signup
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nextParam = searchParams.get("next") || "/";

  // Check for signup success message
  useEffect(() => {
    if (searchParams.get("signupSuccess") === "true") {
      setMessage("Signup successful! Please log in.");
      // Optional: remove the query param from URL without reloading
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authenticated) {
      navigate(nextParam, { replace: true });
    }
  }, [authenticated, navigate, nextParam]);

  // Ensure CSRF token is available
  useEffect(() => {
    if (!csrfToken) {
      fetchCsrfToken();
    }
  }, [csrfToken, fetchCsrfToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage(""); // Clear messages on new submission

    if (!csrfToken) {
      setError("CSRF token not available. Please try again.");
      fetchCsrfToken(); // Attempt to fetch it again
      return;
    }

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
          fetchCsrfToken();
          return response.json();
        }
        return response.json().then((data) => {
          // Try to get a specific error message
          let errorMessage = "Invalid credentials. Please try again.";
          if (data && data.detail) {
            errorMessage = data.detail;
          } else if (data && typeof data === "object") {
            // Handle potential non_field_errors from DRF
            if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
              errorMessage = data.non_field_errors.join(" ");
            } else {
              // Fallback for other error structures
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
        // On success, update auth status and redirect
        await checkAuthStatus(); // Update global auth state
        // Use the user data from the login response if needed immediately
        // console.log("Login successful, user:", data.user);
        navigate(nextParam); // Navigate after state update
      })
      .catch((err) => {
        setError(err.message || "An unexpected error occurred during login.");
        fetchCsrfToken();
      });
  };

  return (
    <div className="container mt-4">
      {" "}
      {/* Add container and top margin */}
      <div className="row justify-content-center">
        {" "}
        {/* Center the content */}
        <div className="col-md-6">
          {" "}
          {/* Limit width on medium screens and up */}
          <h2 className="mb-3 text-center">Login</h2> {/* Center heading */}
          {/* Display success message */}
          {message && (
            <div className="alert alert-success" role="alert">
              {message}
            </div>
          )}
          {/* Display error message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              {" "}
              {/* Bootstrap margin bottom */}
              <label htmlFor="usernameInput" className="form-label">
                {" "}
                {/* Bootstrap label */}
                Username
              </label>
              <input
                type="text"
                className="form-control" /* Bootstrap form control */
                id="usernameInput" /* Link label to input */
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
                autoComplete="current-password" /* Correct autocomplete */
              />
            </div>

            <div className="d-grid gap-2">
              {" "}
              {/* Use grid for full-width button + spacing */}
              <button
                type="submit"
                className="btn btn-primary" /* Bootstrap button */
                disabled={!csrfToken}
              >
                Log In
              </button>
            </div>
          </form>
          {/* Link to Signup Page */}
          <div className="text-center mt-3">
            <p>
              Don't have an account? <Link to="/signup">Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
