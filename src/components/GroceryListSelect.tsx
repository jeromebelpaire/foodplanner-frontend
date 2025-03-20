import GroceryListDropdown from "./GroceryListDropdown";

function GroceryListSelect() {
  return (
    <div className="container py-5">
      <form id="create-grocerylist-select-form" method="post">
        {/* {% csrf_token %} */}
        <label htmlFor="name">Name:</label>
        <br />
        <input type="text" id="name" name="name" required />
        <br />
        <input type="submit" className="btn btn-primary my-1" value="Create New List" />
      </form>
      <GroceryListDropdown />
    </div>
  );
}

export default GroceryListSelect;
