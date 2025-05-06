import { useState, useEffect } from "react";
import { fetchFromBackend } from "./fetchFromBackend";

export function TermsOfServicePage() {
  const [tosContent, setTosContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFromBackend("/api/tos/latest/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Terms of Service.");
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.content) {
          setTosContent(data.content);
        } else {
          throw new Error("Terms of Service content not found in response.");
        }
      })
      .catch((err) => {
        setError(err.message || "An unexpected error occurred.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <p>Loading Terms of Service...</p>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <p className="mb-0">Please try again later or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div dangerouslySetInnerHTML={{ __html: tosContent }} />
        </div>
      </div>
    </div>
  );
}
