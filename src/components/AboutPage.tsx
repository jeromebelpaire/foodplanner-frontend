import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="mb-4 text-center">Welcome to ShareSpice</h1>
          <p className="lead text-center mb-5">
            ShareSpice helps you organize recipes, plan meals, and share cooking ideas with friends.
            Discover new dishes, coordinate meals together, and simplify your cooking routine.
          </p>

          <p className="text-center mb-5">
            <i>Have questions or ideas? Reach out at sharespice.info@gmail.com</i>
            <br />
            <i>
              This is a personal project, so things may break, but thanks for joining the journey!
            </i>
          </p>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Discover & Share</h2>
              <p className="card-text">
                Find inspiration from friends and other home cooks. Try new recipes, share your
                successes, and build your cooking community.
              </p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Your Recipes, Organized</h2>
              <p className="card-text">
                Save recipes from anywhere or add your own family favorites. Easily share dishes
                with friends and see what they're cooking too!
              </p>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title h4">Smart Grocery Lists</h2>
              <p className="card-text">
                Plan your meals and automatically generate grocery lists. Our smart system combines
                ingredients, suggests quantities, and lets you check off items as you shop. Say
                goodbye to forgotten items and multiple trips to the store.
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2>Ready to get cooking?</h2>
            <p>Join ShareSpice and make cooking more social and enjoyable!</p>
            <Link to="/signup" className="btn btn-primary btn-lg mt-3">
              Sign Up - It's Free
            </Link>
          </div>
          <br />
        </div>
      </div>
    </div>
  );
}
