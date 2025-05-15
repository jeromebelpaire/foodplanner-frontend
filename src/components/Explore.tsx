import { useEffect, useState, useCallback } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { Link } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { StarRating } from "./StarRating";

export function Explore() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm === "" || searchTerm.length >= 2) {
        setDebouncedSearchTerm(searchTerm);
      } else {
        setDebouncedSearchTerm("");
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      setError(null);
      setRecipes([]);
      setNextPageUrl(null);

      let url = "/api/recipes/recipes/";
      if (debouncedSearchTerm) {
        url += `?search=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      try {
        const res = await fetchFromBackend(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setRecipes(data.results);
        setNextPageUrl(data.next);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError(
          `Failed to load recipes. ${
            err instanceof Error ? err.message : "Please try again later."
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (debouncedSearchTerm === "" || debouncedSearchTerm.length >= 2) {
      fetchRecipes();
    } else {
      setRecipes([]);
      setNextPageUrl(null);
      setIsLoading(false);
      setError(null);
    }
  }, [debouncedSearchTerm]);

  const loadMoreRecipes = useCallback(async () => {
    if (!nextPageUrl || isLoadingMore || isLoading || searchTerm.length === 1) return;

    setIsLoadingMore(true);
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
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageUrl, isLoadingMore, isLoading, searchTerm]);

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
        <h1 className="mb-3">Latest Recipes</h1>

        <div className="mb-4">
          <input
            type="search"
            className="form-control"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search recipes"
          />
        </div>

        {isLoading && (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}

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
