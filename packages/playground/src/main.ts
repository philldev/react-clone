import "./style.css";
import { render, createElement } from "blaze-ui";

const root = document.getElementById("app")!;

render(
  createElement(
    "div",
    {
      className: "container",
    },
    [
      createElement("h1", {}, "Hello World"),
      createElement("p", {}, "This is a paragraph"),
      createElement(
        "button",
        {
          className: "btn",
          onClick: () => alert("Clicked!"),
        },
        "Click me",
      ),
    ],
  ),
  root,
);
