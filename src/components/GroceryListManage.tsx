import { useState } from "react";
import { GroceryListDropdown } from "./GroceryListDropdown";
import { PlannedIngredientsList } from "./PlannedIngredientsList";
import { PlannerDropdown } from "./PlannerDropdown";
import { PlannedItemsList } from "./PlannedItemsList";

function GroceryListManage() {
  const [plannedItemUpdateFlag, setplannedItemUpdateFlag] = useState(false);

  const handleRecipePlanned = () => {
    setplannedItemUpdateFlag((prev) => !prev);
  };
  return (
    <div className="container py-5">
      <GroceryListDropdown />
      <PlannedIngredientsList plannedItemUpdateFlag={plannedItemUpdateFlag} />
      <PlannerDropdown onPlanned={handleRecipePlanned} type={"recipe"} />
      <PlannedItemsList
        onRecipePlanned={handleRecipePlanned}
        plannedItemUpdateFlag={plannedItemUpdateFlag}
        type={"recipe"}
      />
      <PlannerDropdown onPlanned={handleRecipePlanned} type={"extra"} />
      <PlannedItemsList
        onRecipePlanned={handleRecipePlanned}
        plannedItemUpdateFlag={plannedItemUpdateFlag}
        type={"extra"}
      />
    </div>
  );
}

export default GroceryListManage;
