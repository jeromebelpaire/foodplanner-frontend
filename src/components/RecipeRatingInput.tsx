import React, { useState, useEffect } from "react";
import { fetchFromBackend } from "./fetchFromBackend";

interface RecipeRatingInputProps {
  recipeId: number;
  initialRating: number | null; // Backend scale 0-10
  ratingId: number | null;
  userId: number | undefined; // Needed? Backend gets user from session
  csrfToken: string | null;
  onRatingSubmitted: () => void; // Callback to refetch recipe details
}

// Represents a single star's state
type StarDisplay = "empty" | "half" | "full";

const RecipeRatingInput: React.FC<RecipeRatingInputProps> = ({
  recipeId,
  initialRating,
  ratingId,
  csrfToken,
  onRatingSubmitted,
}) => {
  // State for the currently selected/saved rating (0-5 scale for UI)
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  // State for the rating shown on hover (0-5 scale for UI)
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRatingId, setCurrentRatingId] = useState<number | null>(ratingId);

  useEffect(() => {
    // Convert initial backend rating (0-10) to UI scale (0-5)
    setSelectedRating(initialRating !== null ? initialRating / 2 : null);
    setCurrentRatingId(ratingId);
  }, [initialRating, ratingId]);

  const handleMouseEnter = (index: number) => {
    setHoverRating(index + 0.5); // Hover over star 'i' means rating 'i + 0.5'
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const handleClick = async () => {
    // Use the hoverRating which reflects the intended half/full star based on hover position
    const clickedUiRating = hoverRating;

    if (!csrfToken || isSubmitting || clickedUiRating === null) {
      // Don't submit if no rating is hovered, already submitting, or no token
      console.warn("Rating submission prevented. Conditions not met.", {
        csrfToken: !!csrfToken,
        isSubmitting,
        clickedUiRating,
      });
      return;
    }

    // const clickedUiRating = index + 0.5; // OLD: Always set half star
    const backendRating = Math.round(clickedUiRating * 2); // Convert 0-5 UI scale to 0-10 backend scale

    setIsSubmitting(true);
    setError(null);

    const url = currentRatingId
      ? `/api/recipes/ratings/${currentRatingId}/`
      : "/api/recipes/ratings/";
    const method = currentRatingId ? "PUT" : "POST";
    const body: { rating: number; recipe?: number } = { rating: backendRating };
    body.recipe = recipeId;

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
        const errorData = await response.json().catch(() => ({})); // Try parsing error
        throw new Error(
          `Failed to submit rating: ${response.statusText} ${errorData.detail || ""}`
        );
      }

      const result = await response.json();

      // Update state after successful submission
      setSelectedRating(clickedUiRating);
      if (method === "POST" && result.id) {
        setCurrentRatingId(result.id); // Store the new ID if created
      }

      // Trigger refetch in parent component
      onRatingSubmitted();
    } catch (err) {
      console.error("Rating submission error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which rating to display (hover or selected)
  const displayRating = hoverRating ?? selectedRating;

  const stars: StarDisplay[] = Array(5).fill("empty");
  if (displayRating !== null) {
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars[i] = "full";
    }
    if (hasHalfStar && fullStars < 5) {
      stars[fullStars] = "half";
    }
  }

  const getStarClass = (starType: StarDisplay): string => {
    switch (starType) {
      case "full":
        return "bi-star-fill";
      case "half":
        return "bi-star-half";
      default:
        return "bi-star";
    }
  };

  return (
    <div className="mt-4 p-3 border rounded bg-light">
      <h5 className="mb-3">Rate this recipe:</h5>
      <div className="d-flex align-items-center mb-2" onMouseLeave={handleMouseLeave}>
        {stars.map((starType, index) => (
          <i
            key={index}
            className={`bi ${getStarClass(starType)} text-warning fs-4 mx-1`}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => handleClick()}
            role="button"
            aria-label={`Rate ${index + 0.5} stars`}
          />
        ))}
        <span className="ms-3 fs-5">
          {displayRating !== null ? displayRating.toFixed(1) : "Select"} / 5.0
        </span>
      </div>
      {isSubmitting && <div className="text-muted small">Submitting...</div>}
      {error && <div className="alert alert-danger alert-sm mt-2 py-1 px-2">{error}</div>}
      {!csrfToken && (
        <div className="alert alert-warning alert-sm mt-2 py-1 px-2">
          Cannot submit rating: Missing token.
        </div>
      )}
    </div>
  );
};

export default RecipeRatingInput;
