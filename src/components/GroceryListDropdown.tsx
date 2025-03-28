import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWithCSRF } from "./fetchWithCSRF";

function GroceryListDropdown() {
  interface GroceryList {
    name: string;
    id: string;
    username: string;
  }

  interface GroceryListCollection {
    [key: string]: GroceryList;
  }

  const [groceryLists, setgroceryLists] = useState<GroceryListCollection>({});
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchGroceryLists();
  }, []);

  const { grocerylistid } = useParams();

  function handleSelect(list: GroceryList) {
    setSelectedList(list);
    navigate(`/grocery-list/${list.id}`, { state: { selectedList: selectedList } });
  }

  async function fetchGroceryLists() {
    const res = await fetchWithCSRF("http://127.0.0.1:8000/recipes/get_grocery_lists");
    const data = await res.json();
    setgroceryLists(data);
  }

  return (
    <>
      <div className="dropdown">
        <button
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {/* TODO check if this is really the best way to do it */}
          {selectedList
            ? `selected: ${selectedList.name}`
            : grocerylistid && Object.keys(groceryLists).length > 0
            ? `selected: ${groceryLists[grocerylistid].name}`
            : "Please select list"}
        </button>
        <ul className="dropdown-menu">
          {Object.values(groceryLists).map((list) => (
            <li key={list.id}>
              <button
                type="button"
                // className="dropdown-menu"
                onClick={() => handleSelect(list)}
              >{`${list.name}`}</button>
            </li>
          ))}
        </ul>
      </div>
      <br />
    </>
  );
}

export default GroceryListDropdown;
