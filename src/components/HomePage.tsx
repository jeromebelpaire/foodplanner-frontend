import { useEffect, useState } from "react";

interface Recipe {
  title?: string;
  id?: number;
  slug?: string;
}

function HomePage() {
  const [recipes, setrecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  async function fetchAllRecipes() {
    const res = await fetch("http://127.0.0.1:8000/recipes/get_recipes/");
    const data = await res.json();
    setrecipes(data.recipes);
  }

  return (
    <>
      <div className="container py-5">
        <h1 className="mb-5">Latest Recipes</h1>
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {recipes.map((recipe) => (
            <div className="col">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{recipe.title}</h5>
                </div>
                <div className="card-footer">
                  <a href={`/recipe/${recipe.id}/${recipe.slug}`} className="btn btn-primary">
                    Read More
                  </a>
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
