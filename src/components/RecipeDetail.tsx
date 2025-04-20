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
  if (loading) return <div className="text-center p-6">Loading recipe...</div>;
  // Display specific error, fallback to generic message
  if (error)
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-600 p-4 bg-red-100 rounded">Error: {error}</div>
      </div>
    );
  if (!recipe) return <div className="text-center p-6">Recipe not found</div>;

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
    <div className="max-w-4xl mx-auto p-4">
      {/* Back link and Edit/Delete buttons */}
      <div className="flex justify-between items-center mb-4">
        <Link to="/recipes" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
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
          <div className="flex space-x-2">
            <Link
              to={`/recipes/${id}/edit`}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-150 ease-in-out"
            >
              Edit
            </Link>
            <button
              onClick={handleDeleteRecipe}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition duration-150 ease-in-out"
              aria-label={`Delete recipe ${recipe.title}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2 break-words">{recipe.title}</h1>
        <div className="text-gray-600 text-sm mb-4 space-x-2">
          <span>By {recipe.author_username || "Unknown Author"}</span>
          <span>&bull;</span>
          <span>Created: {formatDate(recipe.created_on)}</span>
          {recipe.updated_on && recipe.updated_on !== recipe.created_on && (
            <span className="text-gray-500">(Updated: {formatDate(recipe.updated_on)})</span>
          )}
        </div>

        {recipe.image && typeof recipe.image === "string" && (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full max-h-96 object-cover rounded-md mb-6 shadow"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-image.svg";
            }} // Handle image load errors
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Instructions */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold mb-3">Instructions</h2>
            {/* Using prose for better typography, check if Tailwind typography plugin is installed */}
            <div className="prose max-w-none text-gray-700">
              {recipe.content
                .split("\n")
                .filter((p) => p.trim() !== "")
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              {recipe.content.trim() === "" && (
                <p className="italic text-gray-500">No instructions provided.</p>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-4 rounded-lg sticky top-4 border">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Ingredients</h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="guestCount" className="text-sm font-medium">
                    Guests:
                  </label>
                  <input
                    id="guestCount"
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => updateGuestCount(parseInt(e.target.value) || 1)}
                    className="w-16 p-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Number of guests"
                    disabled={loadingIngredients} // Disable while loading new count
                  />
                </div>
              </div>

              {loadingIngredients ? (
                <div className="text-center text-gray-500 text-sm py-4">
                  Updating ingredients...
                </div>
              ) : (
                <ul className="space-y-2 list-disc list-inside text-gray-700">
                  {scaledIngredients.length > 0 ? (
                    scaledIngredients.map((item, i) => <li key={i}>{item}</li>)
                  ) : (
                    <li className="italic text-gray-500 list-none">
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
  );
};

// export default RecipeDetail; // Remove default export
