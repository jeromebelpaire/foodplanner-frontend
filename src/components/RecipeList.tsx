// src/components/RecipeList.tsx
import React, { useState, useEffect } from "react";
import { Recipe } from "../types/Recipe";
import { User } from "../types/User";
import { Link } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";

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

  if (loading) return <div className="text-center p-4">Loading recipes...</div>;
  if (error) return <div className="text-red-500 p-4 bg-red-100 rounded">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Recipes</h1>
        <Link
          to="/recipes/new"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150 ease-in-out"
        >
          Create New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-gray-600 italic">No recipes found. Create your first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="border rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              {/* Link wrapping the image and title for better navigation */}
              <Link to={`/recipes/${recipe.id}`} className="block">
                {recipe.image && (
                  <img
                    src={typeof recipe.image === "string" ? recipe.image : "/placeholder-image.svg"} // Provide a placeholder
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                    }} // Handle image load errors
                  />
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-1 truncate" title={recipe.title}>
                    {recipe.title}
                  </h2>
                </div>
              </Link>
              <div className="p-4 pt-0 mt-auto">
                {" "}
                {/* Push controls to bottom */}
                <p className="text-gray-600 text-sm mb-1">
                  By {recipe.author_username || "Unknown"}
                </p>
                <p className="text-gray-500 text-sm mb-3">
                  {recipe.created_on
                    ? new Date(recipe.created_on).toLocaleDateString()
                    : "Date unknown"}
                </p>
                <div className="flex flex-wrap gap-2 items-center border-t pt-3">
                  <Link
                    to={`/recipes/${recipe.id}`}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150 ease-in-out"
                  >
                    View
                  </Link>

                  {canEditRecipe(recipe) && (
                    <>
                      <Link
                        to={`/recipes/${recipe.id}/edit`}
                        className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-150 ease-in-out"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => recipe.id && handleDeleteRecipe(recipe.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition duration-150 ease-in-out"
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
          ))}
        </div>
      )}
    </div>
  );
};
