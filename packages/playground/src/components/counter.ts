import { el, useState } from "blaze-ui";

export const Counter = () => {
  const [count, setCount] = useState(0);

  const decrementBtn = el(
    "button",
    {
      onclick: () => {
        setCount(() => count - 1);
      },
    },
    "-",
  );

  const incrementBtn = el(
    "button",
    {
      onclick: () => {
        setCount(() => count + 1);
      },
    },
    "+",
  );

  return el(
    "div",
    {},
    el("h1", {}, "Counter"),
    el(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
        },
      },
      decrementBtn,
      el("p", {}, count),
      incrementBtn,
    ),
  );
};
