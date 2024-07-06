import { tags, render } from "blaze-ui";

const { section, div, h1, p, button, ul, li, form, input } = tags;

const container = document.getElementById("app")!;

let app = div(
  h1("Hello"),
  button("Click me"),
  ul(
    li("Item 1"),
    li("Item 2"),
    [li("fragment1"), li("fragment2")],
    li("Item 3"),
  ),
);
render(app, container);
app = div(
  h1("Hello updated"),
  p("Hello"),
  button("Click me"),
  ul(
    li("Item 1"),
    li("Item 2"),
    [li("fragment1"), li("fragment2"), li("fragment3")],
    li("Item 3"),
  ),
);
render(app, container);
