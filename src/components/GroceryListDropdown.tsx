import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import Select from "react-select";

function GroceryListDropdown() {
  const { csrfToken } = useAuth();
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

  async function deleteGroceryList() {
    if (!selectedList || !selectedList.value) {
      console.error("No list selected for deletion");
      return;
    }

    const deleteUrl = `/api/groceries/lists/${selectedList.value}/`;

    try {
      const res = await fetchFromBackend(deleteUrl, {
        method: "DELETE",
        headers: { "X-CSRFToken": csrfToken! },
      });

      if (res.ok) {
        setgroceryLists((prev) => {
          const newState = { ...prev };
          delete newState[selectedList.value!];
          return newState;
        });
        setSelectedList(null);
        navigate(`/grocery-lists`);
      } else {
        console.error("Failed to delete grocery list:", res.status, await res.text());
      }
    } catch (error) {
      console.error("Error deleting grocery list:", error);
    }
  }

  async function fetchGroceryLists() {
    const res = await fetchFromBackend("/api/groceries/lists/");
    const data = await res.json();
    setgroceryLists(data);
  }

  async function handleCreation(formData: FormData) {
    const res = await fetchFromBackend("/api/groceries/lists/", {
      method: "POST",
      headers: { "X-CSRFToken": csrfToken! },
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
        <input className="form-control" name="name" required />
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
      {grocerylistid && selectedList && (
        <button
          className="btn btn-danger float-right delete-button mt-2"
          onClick={deleteGroceryList}
        >
          {`Delete: ${selectedList.label}`}
        </button>
      )}
    </>
  );
}

export default GroceryListDropdown;
