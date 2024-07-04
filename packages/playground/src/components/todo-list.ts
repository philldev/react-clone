import { el, useEffect, useState } from "blaze-ui";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    console.log("effect");
  });

  const todoInput = el("input", {
    type: "text",
    placeholder: "Add todo",
    value: newTodo,
    className: "input input-bordered",
    oninput: (e) => {
      // @ts-ignore
      setNewTodo(e.target.value);
    },
  });

  const addTodoBtn = el(
    "button",
    {
      className: "btn btn-primary mb-4",
      onclick: () => {
        if (newTodo.trim() === "") {
          return;
        }
        setTodos((todos) => [
          ...todos,
          { id: todos.length + 1, text: newTodo, completed: false },
        ]);
        setNewTodo("");
      },
    },
    "Add Todo",
  );

  return el(
    "div",
    {
      className: "p-4",
    },
    el(
      "h1",
      {
        className: "text-3xl font-bold mb-4",
      },
      "Todo List",
    ),
    el(
      "div",
      {
        className: "flex flex-col gap-4",
      },
      todoInput,
      addTodoBtn,
    ),
    el(
      "ul",
      {
        className: "flex flex-col gap-4",
      },
      ...todos.map((todo) => {
        return el(
          "li",
          {},
          el(
            "div",
            {
              className: "flex items-center gap-4",
            },
            el("input", {
              className: "checkbox",
              type: "checkbox",
              checked: todo.completed,
              onchange: (e) => {
                setTodos((todos) => {
                  const newTodos = todos.map((t) => {
                    if (t.id === todo.id) {
                      // @ts-ignore
                      return { ...t, completed: e.target.checked };
                    }
                    return t;
                  });
                  return newTodos;
                });
              },
            }),
            el(
              "div",
              {
                className: `text-sm ${
                  todo.completed ? "line-through" : ""
                } text-gray-500`,
              },
              todo.text,
            ),
            el(
              "button",
              {
                className: "btn btn-sm btn-circle btn-ghost",
                onclick: () => {
                  setTodos((todos) => {
                    const newTodos = todos.filter((t) => t.id !== todo.id);
                    return newTodos;
                  });
                },
              },
              "✕",
            ),
          ),
        );
      }),
    ),
  );
};
