import { useState } from "react";

function DropDown() {
  const cities = ["Tokyo", "Rome", "Brussels"];

  const [selectedIndex, setSelectedIndex] = useState(-1);

  return (
    <ul className="list-group">
      {cities.map((city, index) => (
        <li
          key={city}
          className={selectedIndex === index ? "list-group-item active" : "list-group-item"}
          // onClick={() => setSelectedIndex(index)}
          onClick={(event) => {
            console.log(event.target);
            setSelectedIndex(index);
          }}
        >
          {city}
        </li>
      ))}
    </ul>
  );
}

export default DropDown;
