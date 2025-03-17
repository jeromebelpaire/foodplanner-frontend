import { useEffect, useState } from "react";

function RecipeDetails() {
  const [numberOfGuests, setnumberOfGuests] = useState(1);

  async function fetchUpdatedIngredients(guests: number) {
    console.log(`fetch for ${guests}`);
    const url = "http://127.0.0.1:8000/recipes/get_formatted_ingredients/spaghetti-bolognese/4/";
    const res = await fetch(url);
    const data = res.json();
    console.log(data);
  }

  useEffect(() => {
    fetchUpdatedIngredients(numberOfGuests);
  });

  return (
    <div className="row">
      <div className="col-md-8 offset-md-2">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="display-4">TODO Placeholder Title</h1>
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
        <ul id="ingredients" className="list-group mt-4"></ul>
        <h2 className="mt-4">Instructions</h2>
        {/* <span className="recipe-description mt-4"> {{ recipe.content|linebreaks }} </span> */}
      </div>
    </div>
  );
}

export default RecipeDetails;
