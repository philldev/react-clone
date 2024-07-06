import { tags, render, createElement, useState } from "blaze-ui";

const { div, h1, button, p, ul, li } = tags;

const container = document.getElementById("app")!;

let App = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("clicked");
    setCount(count + 1);
  };

  return div(
    h1("Hello"),
    button(
      {
        onclick: handleClick,
      },
      "Click me",
    ),
    p("App Count: ", count),
    createElement(Counter),
  );
};

let Counter = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("clicked");
    setCount(count + 1);
  };

  return div(
    h1("Hello"),
    button(
      {
        onclick: handleClick,
      },
      "Click me",
    ),
    p("Child Count: ", count),
    ul(new Array(count).fill(null).map((_, i) => li(i))),
  );
};

render(createElement(App), container);
