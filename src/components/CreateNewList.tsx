import { fetchWithCSRF } from "./fetchWithCSRF";

function CreateNewList() {
  async function handleCreation(formData: FormData) {
    // const listName = formData.get("name");
    // console.log(`creating: ${listName}`);
    await fetchWithCSRF(`http://127.0.0.1:8000/recipes/create_grocery_list/`, {
      method: "POST",
      body: formData,
    });
  }
  return (
    <>
      <form action={handleCreation}>
        <input name="name" />
        <button type="submit">Create</button>
      </form>
    </>
  );
}

export default CreateNewList;
