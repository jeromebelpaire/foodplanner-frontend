// src/components/RecipeList.tsx
import React, { useState, useEffect } from "react";
import { Recipe } from "../types/Recipe";
import { User } from "../types/User";
import { Link } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";
import StarRating from "./StarRating"; // Import StarRating component

// Add export
export const RecipeList: React.FC = () => {
  const { csrfToken } = useCSRF();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Use Promise.all to fetch user and recipes concurrently
        const [userResponse, recipesResponse] = await Promise.all([
          fetchFromBackend("/api/auth/status/", { credentials: "include" }),
          fetchFromBackend("/api/recipes/recipes/?mine=true", { credentials: "include" }),
        ]);

        // Check responses
        if (!userResponse.ok) {
          throw new Error(`User fetch failed: ${userResponse.statusText}`);
        }
        if (!recipesResponse.ok) {
          throw new Error(`Recipes fetch failed: ${recipesResponse.statusText}`);
        }

        // Parse JSON
        const userData = await userResponse.json();
        const recipesData = await recipesResponse.json();

        setCurrentUser(userData.user);
        setRecipes(recipesData);
      } catch (err) {
        console.error(err);
        setError(
          `Failed to load data. ${err instanceof Error ? err.message : "Please try again later."}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteRecipe = async (id: number) => {
    if (!id) return; // Ensure id is valid
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        setError(""); // Clear previous errors
        const response = await fetchFromBackend(`/api/recipes/recipes/${id}/`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        });

        if (!response.ok) {
          // Handle specific error statuses if needed (e.g., 403 Forbidden)
          throw new Error(`Delete failed: ${response.statusText}`);
        }

        // Check if response has content before parsing JSON (DELETE might return 204 No Content)
        if (response.status !== 204) {
          await response.json(); // Consume response body if any
        }

        setRecipes(recipes.filter((recipe) => recipe.id !== id));
      } catch (err) {
        console.error(err);
        setError(
          `Failed to delete recipe. ${err instanceof Error ? err.message : "Please try again."}`
        );
      }
    }
  };

  // Check if user can edit a recipe (author or superuser)
  const canEditRecipe = (recipe: Recipe) => {
    if (!currentUser) return false;
    return currentUser.is_superuser || recipe.author_username === currentUser.username;
  };

  if (loading) return <div className="text-center p-3">Loading recipes...</div>;
  if (error) return <div className="alert alert-danger">Error: {error}</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-5 fw-bold">All Recipes</h1>
        <Link to="/recipes/new" className="btn btn-success">
          Create New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-muted fst-italic">No recipes found. Create your first one!</p>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="col">
              <div className="card h-100 shadow-sm hover-shadow">
                {/* Link wrapping the image and title for better navigation */}
                <Link
                  to={`/recipes/${recipe.id}`}
                  state={{ from: "recipes" }}
                  className="text-decoration-none"
                >
                  {recipe.image && (
                    <img
                      src={
                        typeof recipe.image === "string" ? recipe.image : "/placeholder-image.svg"
                      } // Provide a placeholder
                      alt={recipe.title}
                      className="card-img-top"
                      style={{ height: "192px", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                      }} // Handle image load errors
                    />
                  )}
                  <div className="card-body pb-0">
                    <h5 className="card-title text-truncate" title={recipe.title}>
                      {recipe.title}
                    </h5>
                    <StarRating
                      rating={recipe.average_rating ?? 0}
                      count={recipe.rating_count ?? 0}
                    />
                  </div>
                </Link>
                <div className="card-body pt-0 d-flex flex-column">
                  <p className="text-muted small mb-1">By {recipe.author_username || "Unknown"}</p>
                  <p className="text-muted small mb-3">
                    {recipe.created_on
                      ? new Date(recipe.created_on).toLocaleDateString()
                      : "Date unknown"}
                  </p>
                  <div className="d-flex flex-wrap gap-2 border-top pt-3 mt-auto">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      state={{ from: "recipes" }}
                      className="btn btn-primary btn-sm"
                    >
                      View
                    </Link>

                    {canEditRecipe(recipe) && (
                      <>
                        <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-warning btn-sm">
                          Edit
                        </Link>
                        <button
                          onClick={() => recipe.id && handleDeleteRecipe(recipe.id)}
                          className="btn btn-danger btn-sm"
                          aria-label={`Delete recipe ${recipe.title}`}
                          disabled={!recipe.id} // Disable if id is missing
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
