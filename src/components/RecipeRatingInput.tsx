import React, { useState, useEffect } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";

interface RecipeRatingInputProps {
  recipeId: number;
  initialRating: number | null;
  initialComment: string | null;
  ratingId: number | null;
  onRatingSubmitted: () => void;
}

export function RecipeRatingInput({
  recipeId,
  initialRating,
  initialComment,
  ratingId,
  onRatingSubmitted,
}: RecipeRatingInputProps) {
  const { csrfToken } = useAuth();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRatingId, setCurrentRatingId] = useState<number | null>(ratingId);

  useEffect(() => {
    setSelectedRating(initialRating !== null ? initialRating / 2 : null);
    setComment(initialComment ?? "");
    setCurrentRatingId(ratingId);
  }, [initialRating, ratingId, initialComment]);

  const handleFullStarHover = (value: number) => {
    setHoverRating(value);
  };

  const handleHalfStarHover = (value: number) => {
    setHoverRating(value - 0.5);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const ratingToSubmit = hoverRating ?? selectedRating;

  const handleClick = async () => {
    const clickedUiRating = ratingToSubmit;

    if (!csrfToken || isSubmitting || clickedUiRating === null) {
      console.warn("Rating submission prevented. Conditions not met.", {
        csrfToken: !!csrfToken,
        isSubmitting,
        clickedUiRating,
      });
      return;
    }

    const backendRating = Math.round(clickedUiRating * 2);

    setIsSubmitting(true);
    setError(null);

    const url = currentRatingId
      ? `/api/recipes/ratings/${currentRatingId}/`
      : "/api/recipes/ratings/";
    const method = currentRatingId ? "PUT" : "POST";
    const body: { rating: number; comment: string; recipe: number } = {
      rating: backendRating,
      comment: comment.trim(),
      recipe: recipeId,
    };

    try {
      const response = await fetchFromBackend(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to submit rating: ${response.statusText} ${errorData.detail || ""}`
        );
      }

      const result = await response.json();

      setSelectedRating(clickedUiRating);
      if (method === "POST" && result.id) {
        setCurrentRatingId(result.id);
      }

      onRatingSubmitted();
    } catch (err) {
      console.error("Rating submission error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating ?? selectedRating;

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let starType = "empty";
      if (displayRating !== null) {
        if (i <= Math.floor(displayRating)) {
          starType = "full";
        } else if (i - 0.5 <= displayRating) {
          starType = "half";
        }
      }

      stars.push(
        <div
          key={i}
          className="position-relative d-inline-block mx-1"
          style={{ cursor: "pointer" }}
        >
          <i className="bi bi-star text-warning fs-4" />

          <div
            className="position-absolute top-0 start-0 bottom-0 w-50"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => handleHalfStarHover(i)}
            onClick={handleClick}
            role="button"
            aria-label={`Rate ${i - 0.5} stars`}
            title={`${i - 0.5} stars`}
          />
          <div
            className="position-absolute top-0 end-0 bottom-0 w-50"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => handleFullStarHover(i)}
            onClick={handleClick}
            role="button"
            aria-label={`Rate ${i} stars`}
            title={`${i} stars`}
          />

          {starType === "half" && (
            <i
              className="bi bi-star-half text-warning fs-4 position-absolute top-0 start-0"
              style={{ pointerEvents: "none" }}
            />
          )}
          {starType === "full" && (
            <i
              className="bi bi-star-fill text-warning fs-4 position-absolute top-0 start-0"
              style={{ pointerEvents: "none" }}
            />
          )}
        </div>
      );
    }
    return stars;
  };

  return (
    <div className="mt-4 p-3 border rounded bg-light">
      <h5 className="mb-3">Rate this recipe:</h5>
      <div className="d-flex align-items-center mb-2" onMouseLeave={handleMouseLeave}>
        {renderStars()}
        <span className="ms-3 fs-5">
          {displayRating !== null ? displayRating.toFixed(1) : "Select"} / 5.0
        </span>
      </div>
      <div className="mb-3">
        <label htmlFor={`comment-${recipeId}`} className="form-label visually-hidden">
          Add a comment (optional)
        </label>
        <textarea
          id={`comment-${recipeId}`}
          className="form-control form-control-sm"
          rows={3}
          placeholder="Add a comment (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="d-flex justify-content-end align-items-center">
        {isSubmitting && <div className="text-muted small me-2">Submitting...</div>}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleClick}
          disabled={isSubmitting || !csrfToken || ratingToSubmit === null}
          aria-label="Submit rating and comment"
        >
          {currentRatingId ? "Update Rating" : "Submit Rating"}
        </button>
      </div>
      {error && <div className="alert alert-danger alert-sm mt-2 py-1 px-2">{error}</div>}
      {!csrfToken && (
        <div className="alert alert-warning alert-sm mt-2 py-1 px-2">
          Cannot submit rating: Missing token.
        </div>
      )}
    </div>
  );
}
