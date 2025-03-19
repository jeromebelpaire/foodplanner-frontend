import "./App.css";
import HomePage from "./components/HomePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RecipeDetails from "./components/RecipeDetails";
import RecipeSum from "./components/RecipeSum";
import NavBar from "./components/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <BrowserRouter>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="recipe/:recipe_id/:slug" element={<RecipeDetails />} />
          <Route path="recipe_sum" element={<RecipeSum />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
