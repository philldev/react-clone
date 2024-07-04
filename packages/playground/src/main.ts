import { TodoList } from "./components/todo-list";
import { el, render } from "blaze-ui";

const container = document.getElementById("app")!;

render(el(TodoList, {}), container);
