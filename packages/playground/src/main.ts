import { el, tags, render } from "blaze-ui";
import { useReducer, useState } from "blaze-ui/src/hooks";

const { h1, p, button, ul, li, div, form, input } = tags;

const container = document.getElementById("app")!;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type TodoAction =
  | { type: "add"; text: string }
  | { type: "delete"; id: number }
  | { type: "toggle"; id: number };

function todosReducer(state: Todo[], action: TodoAction) {
  console.log(action);
  switch (action.type) {
    case "add":
      const prevId = state.length > 0 ? state[state.length - 1].id : 0;
      const id = prevId + 1;
      return [...state, { id, text: action.text, completed: false }];
    case "delete":
      console.log(action.id);
      return state.filter((todo) => todo.id !== action.id);
    case "toggle":
      return state.map((todo) =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo,
      );
    default:
      return state;
  }
}

function App() {
  const [todos, dispatch] = useReducer(todosReducer, []);

  console.log(todos);

  return div(
    {
      id: "my-app",
      className: "p-4 flex flex-col gap-4",
    },
    h1(
      {
        className: "text-3xl font-bold ",
      },
      "Todo List",
    ),
    el(TodoForm, {
      onSubmit: (text) => dispatch({ type: "add", text }),
    }),
    ul(
      {
        className: "flex flex-col gap-2",
      },
      todos.map((todo) =>
        el(TodoItem, {
          todo,
          onToggle: (id) => dispatch({ type: "toggle", id }),
          onDelete: (id) => dispatch({ type: "delete", id }),
        }),
      ),
    ),
  );
}

function TodoItem({
  onToggle,
  onDelete,
  todo,
}: {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return li(
    {
      className: "flex gap-2 items-center",
    },
    input({
      type: "checkbox",
      checked: todo.completed,
      onchange: () => {
        onToggle(todo.id);
      },
    }),
    p(
      {
        className: `text-sm flex-1 ${todo.completed ? "line-through" : ""}`,
      },

      todo.text,
    ),
    button(
      {
        className: "btn btn-sm",
        onclick: () => {
          onDelete(todo.id);
        },
      },
      "Delete",
    ),
  );
}

function TodoForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");

  function handleSubmit(e: Event) {
    e.preventDefault();

    if (text.trim() !== "") {
      onSubmit(text);
      setText("");
    }
  }

  return form(
    {
      className: "flex flex-col",
      onsubmit: handleSubmit,
    },
    div(
      {
        className: "flex gap-2",
      },
      input({
        className: "input input-bordered flex-1",
        placeholder: "What needs to be done?",
        name: "text",
        value: text,
        // @ts-ignore
        oninput: (e) => setText(e.target.value),
      }),
    ),
  );
}

render(el(App, null), container);
