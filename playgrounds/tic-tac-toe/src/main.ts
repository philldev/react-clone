import "./style.css";
import { render, tags, createElement, useState } from "blaze-ui";
import { checkWinner, noop } from "./utils";
import { useEffect } from "blaze-ui/src/blaze-hooks";

const { div, h1, p, button } = tags;

const container = document.querySelector<HTMLDivElement>("#app")!;

type Player = "X" | "O";
type Square = Player | "";

function App() {
  const [player, setPlayer] = useState<"X" | "O">("X");
  const [board, setBoard] = useState<Square[]>(
    new Array(9).fill("").map(() => ""),
  );
  const [winner, setWinner] = useState<Player | null>(null);

  const onSquareClick = (index: number) => {
    if (board[index] !== "") return;

    const newBoard = board.map((square, i) => {
      if (index === i && square === "") {
        return player;
      }
      return square;
    });

    setBoard(newBoard);
    setPlayer(player === "X" ? "O" : "X");

    const winner = checkWinner(newBoard);

    if (winner) {
      setWinner(winner);
    }
  };

  const reset = () => {
    setBoard(new Array(9).fill("").map(() => ""));
    setPlayer("X");
    setWinner(null);
  };

  const gameOver = winner !== null;

  return div(
    {
      className: "flex flex-col gap-4 items-center justify-center h-screen",
    },
    h1(
      {
        className: "text-4xl",
      },
      "Tic Tac Toe",
    ), // 0

    !winner ? p(`Player: ${player}`) : null, // 2
    winner ? p(`The Winner is: ${winner}`) : null, // 1

    !winner
      ? createElement(Board, {
          board,
          onSquareClick,
          disabled: gameOver,
        })
      : null, //

    button(
      {
        className:
          "bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded",
        onclick: reset,
      },
      "Restart",
    ),
  );
}

function Board(props: {
  board: Square[];
  onSquareClick: (index: number) => void;
  disabled: boolean;
}) {
  const { board, onSquareClick } = props;

  return div(
    {
      className: `w-[200px] h-[200px] border-black border-2 grid grid-rows-3 grid-cols-3 ${props.disabled ? "opacity-50" : ""}`,
    },
    board.map((square, index) =>
      div(
        {
          className:
            "w-full h-full text-center text-2xl font-bold border-black border-2 cursor-pointer flex items-center justify-center",
          onclick: () => (props.disabled ? noop() : onSquareClick(index)),
        },
        square,
      ),
    ),
  );
}

render(createElement(App), container);
