import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="mb-4 text-center">About ShareSpice</h1>
          <p className="lead text-center mb-5">
            Streamline your meal planning, recipe organization, and grocery shopping all in one
            place. Spend less time worrying about "what's for dinner?" and more time enjoying
            delicious, home-cooked meals.
          </p>

          <p className="text-center mb-5">
            <i>
              The website is work in progress, please contact at sharespice.info@gmail.com if there
              any questions or requests.
            </i>
            <br />
            <i>This is a personal project so please be patient with the development</i>
          </p>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Effortless Meal Planning</h2>
              <p className="card-text">
                Plan your meals for the week or month with our intuitive drag-and-drop calendar.
                Easily find recipes, add them to your plan, and visualize your upcoming meals.
              </p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Organize Your Recipes</h2>
              <p className="card-text">
                Save your favorite recipes from the web or add your own creations. Tag recipes, add
                notes, and quickly search your collection to find exactly what you need. Never lose
                that perfect recipe again!
              </p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Smart Grocery Lists</h2>
              <p className="card-text">
                Automatically generate grocery lists based on your meal plan. Our smart system
                combines ingredients, suggests quantities, and lets you check off items as you shop.
                Say goodbye to forgotten items and multiple trips to the store.
              </p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Discover & Share</h2>
              <p className="card-text">
                Explore recipes shared by the community, discover new meal ideas, and share your own
                culinary masterpieces. Connect with other food lovers and expand your cooking
                horizons.
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2>Ready to simplify your kitchen?</h2>
            <p>Sign up today and take the stress out of meal planning!</p>
            <Link to="/signup" className="btn btn-primary btn-lg mt-3">
              Sign Up Now - It's Free!
            </Link>
          </div>
          <br />
        </div>
      </div>
    </div>
  );
}
