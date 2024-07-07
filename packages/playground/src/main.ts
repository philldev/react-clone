import { tags, render, createElement, useState } from "blaze-ui";

const { div, h1, button, p, ul, li } = tags;

const container = document.getElementById("app")!;

let App = () => {
  const [show, setShow] = useState(false);

  const handleClick = () => {
    setShow(!show);
  };

  return div(
    h1(`show: ${show}`),
    button(
      {
        onclick: handleClick,
      },
      "Toggle",
    ),
    createElement(Counter, { count: show ? 1 : 0 }),
  );
};

let Counter = (props: { count: number }) => {
  const [count, setCount] = useState(props.count);

  const handleClick = () => {
    console.log("clicked");
    setCount(count + 1);
  };

  return div(
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
