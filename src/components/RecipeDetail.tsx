// src/components/RecipeDetail.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Recipe, RecipeIngredient } from "../types/Recipe";
import { User } from "../types/User";
import { fetchFromBackend } from "./fetchFromBackend";
import StarRating from "./StarRating";
import RecipeRatingInput from "./RecipeRatingInput";
import { useAuth } from "./AuthContext";
// Define type for backend rating object
interface BackendRecipeRating {
  id: number;
  rating: number; // 0-10 scale
  comment: string | null; // Add comment field
  author_username: string;
  // Add other fields if needed
}

// Add export
export const RecipeDetail: React.FC = () => {
  const { csrfToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = location.state?.from || "home";
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User>();
  const [guestCount, setGuestCount] = useState(4);
  const [userRating, setUserRating] = useState<BackendRecipeRating | null>(null);
  const [userRatingLoading, setUserRatingLoading] = useState(true);

  // Helper function to format scaled ingredients
  const formatIngredient = useCallback((ingredient: RecipeIngredient, count: number): string => {
    if (!ingredient.ingredient || !ingredient.unit) return "Invalid ingredient data";
    const scaledQuantity = ingredient.quantity * count;
    // Simple formatting, adjust as needed (e.g., for fractions, plurals)
    const formattedQuantity = Number.isInteger(scaledQuantity)
      ? scaledQuantity
      : parseFloat(scaledQuantity.toFixed(2)); // Use parseFloat to remove trailing zeros if possible

    return `${formattedQuantity} ${ingredient.unit.name} ${ingredient.ingredient.name}`;
  }, []);

  const fetchRecipeData = useCallback(async () => {
    if (!id) return;
    try {
      const recipeResponse = await fetchFromBackend(`/api/recipes/recipes/${id}/`);

      if (!recipeResponse.ok) throw new Error(`Recipe fetch failed: ${recipeResponse.statusText}`);

      const recipeData = await recipeResponse.json();

      setRecipe(recipeData);
    } catch (err) {
      console.error(err);
      setError(
        `Failed to reload recipe details. ${
          err instanceof Error ? err.message : "Please try again later."
        }`
      );
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Recipe ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setUserRatingLoading(true);
        setError("");

        const userResponse = await fetchFromBackend("/api/auth/status/");
        if (!userResponse.ok) throw new Error(`User fetch failed: ${userResponse.statusText}`);
        const userData = await userResponse.json();
        const fetchedUser = userData.user;
        setCurrentUser(fetchedUser);

        await fetchRecipeData();

        if (fetchedUser) {
          try {
            const ratingsResponse = await fetchFromBackend(`/api/recipes/ratings/?recipe=${id}`);
            if (ratingsResponse.ok) {
              const allRatings: BackendRecipeRating[] = await ratingsResponse.json();
              const foundRating = allRatings.find(
                (r) => r.author_username === fetchedUser.username
              );
              setUserRating(foundRating || null);
            } else {
              console.error("Failed to fetch ratings:", ratingsResponse.statusText);
              setUserRating(null);
            }
          } catch (ratingErr) {
            console.error("Error fetching ratings:", ratingErr);
            setUserRating(null);
          }
        }
      } catch (err) {
        console.error(err);
        setError(
          `Failed to load recipe details. ${
            err instanceof Error ? err.message : "Please try again later."
          }`
        );
      } finally {
        setLoading(false);
        setUserRatingLoading(false);
      }
    };

    fetchData();
  }, [id, fetchRecipeData]);

  const handleDeleteRecipe = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        setError("");
        const response = await fetchFromBackend(`/api/recipes/recipes/${id}/`, {
          method: "DELETE",
          headers: {
            "X-CSRFToken": csrfToken!,
          },
        });

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.statusText}`);
        }

        navigate("/recipes");
      } catch (err) {
        console.error(err);
        setError(
          `Failed to delete recipe. ${err instanceof Error ? err.message : "Please try again."}`
        );
      }
    }
  };

  const handleRatingSubmitted = useCallback(() => {
    const fetchRatingRelatedData = async () => {
      if (!id) return;
      try {
        const recipeResponse = await fetchFromBackend(`/api/recipes/recipes/${id}/`);
        if (recipeResponse.ok) {
          const updatedRecipeData = await recipeResponse.json();
          setRecipe((prevRecipe) => ({ ...prevRecipe, ...updatedRecipeData }));
        } else {
          console.error("Failed to re-fetch recipe data after rating.");
        }
      } catch (err) {
        console.error("Error fetching data after rating submission:", err);
      }
    };
    fetchRatingRelatedData();
  }, [id]);

  // Calculate scaled ingredients dynamically using useMemo
  const scaledIngredientsList = useMemo(() => {
    if (!recipe?.recipe_ingredients || guestCount < 1) {
      return [];
    }
    return recipe.recipe_ingredients.map((ing) => formatIngredient(ing, guestCount));
  }, [recipe?.recipe_ingredients, guestCount, formatIngredient]);

  const canEditRecipe = () => {
    if (!currentUser || !recipe) return false;
    return currentUser.is_superuser || recipe.author_username === currentUser.username;
  };

  if (loading) return <div className="text-center p-3">Loading recipe...</div>;
  if (error)
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  if (!recipe) return <div className="text-center p-3">Recipe not found</div>;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link
          to={fromPage === "recipes" ? "/recipes" : "/"}
          className="text-decoration-none d-flex align-items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="me-1"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to Recipes
        </Link>

        {canEditRecipe() && (
          <div className="d-flex gap-2">
            <Link to={`/recipes/${id}/edit`} className="btn btn-warning btn-sm">
              Edit
            </Link>
            <button
              onClick={handleDeleteRecipe}
              className="btn btn-danger btn-sm"
              aria-label={`Delete recipe ${recipe.title}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="card shadow mb-4">
        <div className="card-body">
          <h1 className="display-5 fw-bold mb-2 text-break">{recipe.title}</h1>
          <StarRating rating={recipe.average_rating ?? 0} count={recipe.rating_count ?? 0} />
          <div className="text-muted small mb-4">
            <span>By {recipe.author_username || "Unknown Author"}</span>
            <span className="mx-1">&bull;</span>
            <span>Created: {formatDate(recipe.created_on)}</span>
            {recipe.updated_on && recipe.updated_on !== recipe.created_on && (
              <span className="text-muted">(Updated: {formatDate(recipe.updated_on)})</span>
            )}
          </div>

          {recipe.image && typeof recipe.image === "string" && (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="img-fluid rounded mb-4 shadow-sm"
              style={{ maxHeight: "400px", objectFit: "cover", width: "100%" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.svg";
              }}
            />
          )}

          <div className="row">
            <div className="col-md-8 mb-3 mb-md-0">
              <h2 className="h4 fw-semibold mb-3">Instructions</h2>
              <div className="text-secondary">
                {recipe.content ? (
                  <div dangerouslySetInnerHTML={{ __html: recipe.content }} />
                ) : (
                  <p className="fst-italic text-muted">No instructions provided.</p>
                )}
                {recipe.content.trim() === "" && (
                  <p className="fst-italic text-muted">No instructions provided.</p>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="card bg-light sticky-top" style={{ top: "1rem" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h5 fw-semibold mb-0">Ingredients</h2>
                    <div className="d-flex align-items-center">
                      <label htmlFor="guestCount" className="form-label small me-2 mb-0">
                        Guests:
                      </label>
                      <input
                        id="guestCount"
                        type="number"
                        min="1"
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                        className="form-control form-control-sm"
                        style={{ width: "4rem" }}
                        aria-label="Number of guests"
                      />
                    </div>
                  </div>

                  <ul className="list-group list-group-flush">
                    {scaledIngredientsList.length > 0 ? (
                      scaledIngredientsList.map((item, i) => (
                        <li key={i} className="list-group-item bg-transparent px-0 py-1 border-0">
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="list-group-item bg-transparent px-0 py-1 border-0 fst-italic text-muted">
                        {recipe?.recipe_ingredients === undefined
                          ? "Loading ingredients..."
                          : "No ingredients listed for this recipe."}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {currentUser && !userRatingLoading && (
            <RecipeRatingInput
              recipeId={parseInt(id!)}
              initialRating={userRating?.rating ?? null}
              initialComment={userRating?.comment ?? null}
              ratingId={userRating?.id ?? null}
              onRatingSubmitted={handleRatingSubmitted}
            />
          )}
          {userRatingLoading && (
            <div className="text-center text-muted small mt-3">Loading your rating...</div>
          )}
        </div>
      </div>
    </div>
  );
};

// export default RecipeDetail; // Remove default export
