// src/components/RecipeDetail.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { User } from "../types/User";
import { fetchFromBackend } from "./fetchFromBackend";

// Add export
export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User>();
  const [guestCount, setGuestCount] = useState(1);
  const [scaledIngredients, setScaledIngredients] = useState<string[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Recipe ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");

        // Use Promise.all for concurrent fetching
        const [userResponse, recipeResponse, ingredientsResponse] = await Promise.all([
          fetchFromBackend("/api/auth/status/"),
          fetchFromBackend(`/api/recipes/recipes/${id}/`),
          fetchFromBackend(`/api/recipes/recipes/${id}/formatted_ingredients/?guests=1`),
        ]);

        // Check responses
        if (!userResponse.ok) throw new Error(`User fetch failed: ${userResponse.statusText}`);
        if (!recipeResponse.ok)
          throw new Error(`Recipe fetch failed: ${recipeResponse.statusText}`);
        if (!ingredientsResponse.ok)
          throw new Error(`Ingredients fetch failed: ${ingredientsResponse.statusText}`);

        // Parse JSON
        const userData = await userResponse.json();
        const recipeData = await recipeResponse.json();
        const ingredientsData = await ingredientsResponse.json();

        setCurrentUser(userData.user);
        setRecipe(recipeData);
        setScaledIngredients(ingredientsData.ingredients);
      } catch (err) {
        console.error(err);
        setError(
          `Failed to load recipe details. ${
            err instanceof Error ? err.message : "Please try again later."
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDeleteRecipe = async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        setError(""); // Clear previous errors
        const response = await fetchFromBackend(`/api/recipes/recipes/${id}/`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.statusText}`);
        }

        // No need to parse response for DELETE usually (204 No Content)
        navigate("/recipes"); // Navigate after successful delete
      } catch (err) {
        console.error(err);
        setError(
          `Failed to delete recipe. ${err instanceof Error ? err.message : "Please try again."}`
        );
      }
    }
  };

  const updateGuestCount = async (count: number) => {
    if (!id || count < 1) return; // Basic validation
    setGuestCount(count);
    setLoadingIngredients(true);
    try {
      const response = await fetchFromBackend(
        `/api/recipes/recipes/${id}/formatted_ingredients/?guests=${count}`
      );
      if (!response.ok) {
        throw new Error(`Failed to update ingredients: ${response.statusText}`);
      }
      const data = await response.json();
      setScaledIngredients(data.ingredients);
    } catch (err) {
      console.error(err);
      // Optionally set an error state specific to ingredients
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Check if user can edit this recipe
  const canEditRecipe = () => {
    if (!currentUser || !recipe) return false;
    return currentUser.is_superuser || recipe.author_username === currentUser.username;
  };

  // Loading and Error States
  if (loading) return <div className="text-center p-3">Loading recipe...</div>;
  // Display specific error, fallback to generic message
  if (error)
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  if (!recipe) return <div className="text-center p-3">Recipe not found</div>;

  // Format dates nicely
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
      {/* Back link and Edit/Delete buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/recipes" className="text-decoration-none d-flex align-items-center">
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

      {/* Recipe Content */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h1 className="display-5 fw-bold mb-2 text-break">{recipe.title}</h1>
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
              }} // Handle image load errors
            />
          )}

          <div className="row">
            {/* Instructions */}
            <div className="col-md-8 mb-3 mb-md-0">
              <h2 className="h4 fw-semibold mb-3">Instructions</h2>
              <div className="text-secondary">
                {recipe.content ? (
                  <div dangerouslySetInnerHTML={{ __html: recipe.content }} />
                ) : (
                  <p className="fst-italic text-muted">No instructions provided.</p>
                )}
              </div>
            </div>

            {/* Ingredients */}
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
                        onChange={(e) => updateGuestCount(parseInt(e.target.value) || 1)}
                        className="form-control form-control-sm"
                        style={{ width: "4rem" }}
                        aria-label="Number of guests"
                        disabled={loadingIngredients} // Disable while loading new count
                      />
                    </div>
                  </div>

                  {loadingIngredients ? (
                    <div className="text-center text-muted small py-3">Updating ingredients...</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {scaledIngredients.length > 0 ? (
                        scaledIngredients.map((item, i) => (
                          <li key={i} className="list-group-item bg-transparent px-0 py-1 border-0">
                            {item}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item bg-transparent px-0 py-1 border-0 fst-italic text-muted">
                          No ingredients listed for this recipe.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// export default RecipeDetail; // Remove default export
