// src/components/RecipeList.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Recipe } from "../types/Recipe";
import { User } from "../types/User";
import { Link } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import StarRating from "./StarRating";

// Add export
export const RecipeList: React.FC = () => {
  const { csrfToken } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await fetchFromBackend("/api/auth/status/", {
          credentials: "include",
        });
        if (!userResponse.ok) {
          throw new Error(`User fetch failed: ${userResponse.statusText}`);
        }
        const userData = await userResponse.json();
        setCurrentUser(userData.user || null);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          `Failed to load user data. ${
            err instanceof Error ? err.message : "Please try again later."
          }`
        );
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchInitialRecipes = async () => {
      if (!isInitialLoading) return;

      setError(null);
      try {
        const recipesResponse = await fetchFromBackend("/api/recipes/recipes/?mine=true", {
          credentials: "include",
        });

        if (!recipesResponse.ok) {
          throw new Error(`Recipes fetch failed: ${recipesResponse.statusText}`);
        }

        const recipesData = await recipesResponse.json();
        setRecipes(recipesData.results);
        setNextPageUrl(recipesData.next);
      } catch (err) {
        console.error("Error fetching initial recipes:", err);
        setError(
          `Failed to load recipes. ${
            err instanceof Error ? err.message : "Please try again later."
          }`
        );
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialRecipes();
  }, [isInitialLoading]);

  // Function to load more recipes
  const loadMoreRecipes = useCallback(async () => {
    // Prevent fetching if already loading, no next page, or during initial load
    if (!nextPageUrl || isLoadingMore || isInitialLoading) return;

    setIsLoadingMore(true);
    // Optionally clear or manage errors specifically for loading more
    // setError(null);
    try {
      const res = await fetchFromBackend(nextPageUrl, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch next page: ${res.statusText}`);
      }
      const data = await res.json();
      setRecipes((prevRecipes) => [...prevRecipes, ...data.results]);
      setNextPageUrl(data.next);
    } catch (err) {
      console.error("Error fetching more recipes:", err);
      // Set error state or show a notification, decide how to handle this error
      // setError(`Failed to load more recipes. ${err.message}`);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageUrl, isLoadingMore, isInitialLoading]); // Dependencies

  // Effect for scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300; // Offset

      if (scrolledToBottom) {
        loadMoreRecipes();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreRecipes]); // Dependency

  const handleDeleteRecipe = async (id: number) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        setError(null);
        const response = await fetchFromBackend(`/api/recipes/recipes/${id}/`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken!,
          },
        });

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.statusText}`);
        }

        if (response.status !== 204) {
          await response.json();
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

  const canEditRecipe = (recipe: Recipe) => {
    if (!currentUser) return false;
    return currentUser.is_superuser || recipe.author_username === currentUser.username;
  };

  if (isInitialLoading) return <div className="text-center p-3">Loading recipes...</div>;
  if (error && recipes.length === 0)
    return <div className="alert alert-danger">Error: {error}</div>;

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
                <Link
                  to={`/recipes/${recipe.id}`}
                  state={{ from: "recipes" }}
                  className="text-decoration-none"
                >
                  {recipe.image && (
                    <img
                      src={
                        typeof recipe.image === "string" ? recipe.image : "/placeholder-image.svg"
                      }
                      alt={recipe.title}
                      className="card-img-top"
                      style={{ height: "192px", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                      }}
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
                          disabled={!recipe.id}
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

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="d-flex justify-content-center my-4">
          <div className="spinner-border spinner-border-sm text-secondary" role="status">
            <span className="visually-hidden">Loading more recipes...</span>
          </div>
        </div>
      )}
    </div>
  );
};
