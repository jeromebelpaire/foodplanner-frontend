import { useEffect, useState } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { Link } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import StarRating from "./StarRating";

function HomePage() {
  const [recipes, setrecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  async function fetchAllRecipes() {
    const res = await fetchFromBackend("/api/recipes/recipes/");
    const data = await res.json();
    setrecipes(data.results);
  }

  return (
    <>
      <div className="container py-5">
        <h1 className="mb-5">Latest Recipes</h1>
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
      </div>
    </>
  );
}

export default HomePage;
