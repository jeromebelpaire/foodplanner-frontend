import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";
import Select from "react-select";

function GroceryListDropdown() {
  const { csrfToken } = useCSRF();
  interface GroceryList {
    name: string;
    id: number;
    username: string;
  }

  interface GroceryListCollection {
    [key: string]: GroceryList;
  }

  interface Option {
    value?: number;
    label?: string;
  }

  const [groceryLists, setgroceryLists] = useState<GroceryListCollection>({});
  const [selectedList, setSelectedList] = useState<Option | null>(null);

  const navigate = useNavigate();
  const { grocerylistid } = useParams();

  const options: Option[] = useMemo(() => {
    return Object.values(groceryLists).map((list) => ({
      value: list.id,
      label: list.name,
    }));
  }, [groceryLists]);

  useEffect(() => {
    fetchGroceryLists();
  }, []);

  useEffect(() => {
    if (grocerylistid && options.length > 0) {
      const foundOption = options.find((option) => option.value === parseInt(grocerylistid));
      if (foundOption) {
        setSelectedList(foundOption);
      }
    }
  }, [grocerylistid, options]);

  const handleSelectChange = (option: Option | null) => {
    setSelectedList(option);
    navigate(`/grocery-list/${option!.value}`);
  };

  async function deleteGroceryList(deleteUrl: string) {
    if (!selectedList) {
      throw new Error("Please select a list first");
    }
    await fetchFromBackend(deleteUrl, {
      method: "POST",
      headers: { "X-CSRFToken": csrfToken },
      body: JSON.stringify({ grocery_list: selectedList.value }),
    });
    navigate(`/grocery-lists`);
  }

  async function fetchGroceryLists() {
    const res = await fetchFromBackend("/recipes/get_grocery_lists");
    const data = await res.json();
    setgroceryLists(data);
  }

  async function handleCreation(formData: FormData) {
    const res = await fetchFromBackend(`/recipes/create_grocery_list/`, {
      method: "POST",
      headers: { "X-CSRFToken": csrfToken },
      body: formData,
    });
    // TODO review
    const newList: GroceryList = await res.json();
    const newOption = { value: newList.id, label: newList.name };

    setgroceryLists((prev) => ({
      ...prev,
      [newList.id]: newList,
    }));
    navigate(`/grocery-list/${newList.id}`);
    setSelectedList(newOption);
  }

  return (
    <>
      <form action={handleCreation}>
        <input className="form-control" name="name" />
        <button className="btn btn-primary" type="submit">
          Create New List
        </button>
      </form>
      <br />
      <Select
        options={options}
        value={selectedList}
        onChange={handleSelectChange}
        placeholder={`Select a list`}
      />
      {grocerylistid && (
        <button
          className="btn btn-danger float-right delete-button"
          onClick={() => deleteGroceryList(`/recipes/delete_grocery_list/`)}
        >
          {`Delete: ${selectedList?.label}`}
        </button>
      )}
    </>
  );
}

export default GroceryListDropdown;
