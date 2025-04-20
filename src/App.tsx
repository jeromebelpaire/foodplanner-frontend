import "./App.css";
import Login from "./components/Login";
import HomePage from "./components/HomePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RecipeDetails from "./components/RecipeDetails";
import GroceryListSelect from "./components/GroceryListSelect";
import NavBar from "./components/NavBar";
import GroceryListManage from "./components/GroceryListManage";
import { PrivateRoute } from "./components/PrivateRoute";
import { CSRFProvider } from "./components/CSRFContext";
import { RecipeList } from "./components/RecipeList";
import { RecipeDetail } from "./components/RecipeDetail";
import { NewRecipe } from "./components/NewRecipe";
import { EditRecipe } from "./components/EditRecipe";

function App() {
  return (
    <>
      <BrowserRouter>
        <CSRFProvider>
          <NavBar />
          <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route index element={<HomePage />} />
              <Route path="recipe/:recipe_id/:slug" element={<RecipeDetails />} />
              <Route path="grocery-lists" element={<GroceryListSelect />} />
              <Route path="grocery-list/:grocerylistid" element={<GroceryListManage />} />
              <Route path="/recipes" element={<RecipeList />} />
              <Route path="/recipes/new" element={<NewRecipe />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/recipes/:id/edit" element={<EditRecipe />} />
            </Route>
          </Routes>
        </CSRFProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
