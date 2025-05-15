import "./App.css";
import { Login } from "./components/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GroceryListSelect } from "./components/GroceryListSelect";
import { NavBar } from "./components/NavBar";
import GroceryListManage from "./components/GroceryListManage";
import { PrivateRoute } from "./components/PrivateRoute";
import { AuthProvider } from "./components/AuthContext";
import { RecipeList } from "./components/RecipeList";
import { RecipeDetail } from "./components/RecipeDetail";
import { NewRecipe } from "./components/NewRecipe";
import { EditRecipe } from "./components/EditRecipe";
import { Signup } from "./components/Signup";
import { AboutPage } from "./components/AboutPage";
import { LandingPage } from "./components/LandingPage";
import { Explore } from "./components/Explore";
import { TermsOfServicePage } from "./components/TermsOfServicePage";
import { Footer } from "./components/Footer";
import { CookiePolicyPage } from "./components/CookiePolicyPage";

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <NavBar />
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route index element={<LandingPage />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="recipe/:id/:slug" element={<RecipeDetail />} />
              <Route path="grocery-lists" element={<GroceryListSelect />} />
              <Route path="grocery-list/:grocerylistid" element={<GroceryListManage />} />
              <Route path="/recipes" element={<RecipeList />} />
              <Route path="/recipes/new" element={<NewRecipe />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/recipes/:id/edit" element={<EditRecipe />} />
            </Route>
          </Routes>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
