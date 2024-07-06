import { tags, render, createElement } from "blaze-ui";

const { div, h1, button, ul, li } = tags;

const container = document.getElementById("app")!;

let App = () =>
  div(
    h1("Hello"),
    button("Click me"),
    ul(li("Item 1"), li("Item 2"), li("Item 3")),
  );

render(createElement(App), container);
