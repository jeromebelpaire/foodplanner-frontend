import "./App.css";
import Login from "./components/Login";
import HomePage from "./components/HomePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RecipeDetails from "./components/RecipeDetails";
import GroceryListSelect from "./components/GroceryListSelect";
import NavBar from "./components/NavBar";
import GroceryListManage from "./components/GroceryListManage";
import { PrivateRoute } from "./components/PrivateRoute";

function App() {
  return (
    <>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route index element={<HomePage />} />
            <Route path="recipe/:recipe_id/:slug" element={<RecipeDetails />} />
            <Route path="grocery-lists" element={<GroceryListSelect />} />
            <Route path="grocery-list/:grocerylistid" element={<GroceryListManage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
