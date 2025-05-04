import { useEffect, useState, useCallback } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { Link } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import StarRating from "./StarRating";

function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    const fetchInitialRecipes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchFromBackend("/api/recipes/recipes/");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setRecipes(data.results);
        setNextPageUrl(data.next);
      } catch (err) {
        console.error("Error fetching initial recipes:", err);
        setError(
          `Failed to load recipes. ${
            err instanceof Error ? err.message : "Please try again later."
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialRecipes();
  }, []);

  // Function to load more recipes
  const loadMoreRecipes = useCallback(async () => {
    if (!nextPageUrl || isLoadingMore || isLoading) return; // Prevent multiple fetches

    setIsLoadingMore(true);
    // Don't clear the main error, maybe show a temporary one if needed
    try {
      const res = await fetchFromBackend(nextPageUrl);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setRecipes((prevRecipes) => [...prevRecipes, ...data.results]);
      setNextPageUrl(data.next);
    } catch (err) {
      console.error("Error fetching more recipes:", err);
      // Optionally set a specific error for loading more, or just log it
      // setError(`Failed to load more recipes. ${err.message}`);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageUrl, isLoadingMore, isLoading]); // Dependencies

  // Effect for scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300;

      if (scrolledToBottom) {
        loadMoreRecipes();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreRecipes]);

  return (
    <>
      <div className="container py-5">
        <h1 className="mb-5">Latest Recipes</h1>

        {/* Initial Loading Indicator */}
        {isLoading && (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}

        {/* Recipe Grid */}
        {!isLoading && recipes.length > 0 && (
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="col">
                <div className="card h-100">
                  <img src={`${recipe.image}`} alt="Picture unavailable" className="card-img-top" />
                  <div className="card-body">
                    <h5 className="card-title">{recipe.title}</h5>
                    <StarRating
                      rating={recipe.average_rating ?? 0}
                      count={recipe.rating_count ?? 0}
                    />
                    <p className="text-muted small mb-1">
                      By {recipe.author_username || "Unknown"}
                    </p>
                  </div>
                  <div className="card-footer">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      state={{ from: "home" }}
                      className="btn btn-primary"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && !error && recipes.length === 0 && (
          <div className="alert alert-secondary text-center" role="alert">
            No recipes found.
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
    </>
  );
}

export default HomePage;
