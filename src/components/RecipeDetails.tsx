import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchWithCSRF } from "./fetchWithCSRF";

type RouteParams = {
  recipe_id: string;
};

function RecipeDetails() {
  interface RecipeInfo {
    recipe: string;
    slug: string;
    image: string;
    instructions: string;
  }

  const { recipe_id } = useParams<RouteParams>();
  const [numberOfGuests, setnumberOfGuests] = useState(1);
  const [ingredientList, setingredientList] = useState<string[]>([]);
  const [recipeInfo, setrecipeInfo] = useState<RecipeInfo | null>(null);

  useEffect(() => {
    fetchRecipeInfo(recipe_id!);
  }, [recipe_id]);

  useEffect(() => {
    fetchUpdatedIngredients(recipe_id!, numberOfGuests);
  }, [recipe_id, numberOfGuests]);

  async function fetchUpdatedIngredients(recipe_id: string, guests: number) {
    const url = `http://127.0.0.1:8000/recipes/get_formatted_ingredients/${recipe_id}/${guests}/`;
    const res = await fetchWithCSRF(url);
    const data = await res.json();
    setingredientList(data.ingredients);
  }

  async function fetchRecipeInfo(recipe_id: string) {
    const url = `http://127.0.0.1:8000/recipes/get_recipe_info/${recipe_id}/`;
    const res = await fetchWithCSRF(url);
    const data = await res.json();
    setrecipeInfo(data);
  }

  return (
    <>
      {/* <NavBar /> */}
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="display-4">{recipeInfo?.recipe}</h1>
            <div>
              <button
                id="decrease-guests"
                className="btn btn-secondary"
                onClick={() => setnumberOfGuests((prev) => prev - 1)}
              >
                -
              </button>
              <span id="guest-count">{numberOfGuests}</span>
              <button
                id="increase-guests"
                className="btn btn-primary"
                onClick={() => setnumberOfGuests((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>
          <ul id="ingredients" className="list-group mt-4">
            {ingredientList.map((ingredient, index) => (
              <li key={index} className="list-group-item">
                <h5 className="mb-0">
                  <span className="ingredient-name">{ingredient}</span>
                </h5>
              </li>
            ))}
          </ul>
          <h2 className="mt-4">Instructions</h2>
          {recipeInfo ? (
            <span className="recipe-description mt-4" style={{ whiteSpace: "pre-line" }}>
              {recipeInfo.instructions}
            </span>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </>
  );
}

export default RecipeDetails;
