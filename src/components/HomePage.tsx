import { useEffect, useState } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { Link } from "react-router-dom";

interface Recipe {
  title?: string;
  id?: number;
  slug?: string;
  image?: string;
}

function HomePage() {
  const [recipes, setrecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  async function fetchAllRecipes() {
    const res = await fetchFromBackend("/api/recipes/recipes/");
    const data = await res.json();
    setrecipes(data);
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
