
import { useState, useEffect } from "react";
import "./App.css";

// Check each letter and return its color status
function getTileStatuses(guess, answer) {
  const result = Array(5).fill("absent");
  const remaining = {};

  // First check letters in the correct position
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
    } else {
      remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
  }

  // Then check letters in the wrong position
  for (let i = 0; i < 5; i++) {
    if (result[i] !== "correct" && remaining[guess[i]] > 0) {
      result[i] = "present";
      remaining[guess[i]]--;
    }
  }

  return result;
}

// Single letter tile
function Tile({ letter, status }) {
  return (
    <div className={`tile ${status}`}>
      {letter}
    </div>
  );
}

// Five tiles in one row
function Row({ guess, submitted, solutionWord }) {
  const statuses = submitted
    ? getTileStatuses(guess, solutionWord)
    : [];

  return (
    <div className="row">
      {[0, 1, 2, 3, 4].map((index) => (
        <Tile
          key={index}
          letter={guess[index] || ""}
          status={statuses[index] || ""}
        />
      ))}
    </div>
  );
}

// On-screen keyboard
function Keyboard({ onKeyPress, keyStatus }) {
  const keys = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ];

  return (
    <div className="keyboard">
      {keys.map((row, index) => (
        <div className="key-row" key={index}>

          {index === 2 && (
            <button onClick={() => onKeyPress("ENTER")}>
              ENTER
            </button>
          )}

          {row.split("").map((letter) => (
            <button
              key={letter}
              className={keyStatus[letter] || ""}
              onClick={() => onKeyPress(letter)}
            >
              {letter}
            </button>
          ))}

          {index === 2 && (
            <button onClick={() => onKeyPress("BACKSPACE")}>
              ⌫
            </button>
          )}

        </div>
      ))}
    </div>
  );
}

// Main game component
function App() {

  // Centralized game states
  const [solutionWord] = useState("APPLE");
  const [currentGuess, setCurrentGuess] = useState("");
  const [pastGuesses, setPastGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState("IN_PROGRESS");
  const [keyStatus, setKeyStatus] = useState({});
  const [message, setMessage] = useState("");

  // Submit the current guess
  function submitGuess() {

    if (currentGuess.length !== 5) {
      setMessage("Enter a 5-letter word!");
      return;
    }

    const newGuesses = [...pastGuesses, currentGuess];

    setPastGuesses(newGuesses);

    // Evaluate letters and update keyboard colors
    const statuses = getTileStatuses(currentGuess, solutionWord);
    const updatedKeys = { ...keyStatus };

    const priority = {
      absent: 1,
      present: 2,
      correct: 3
    };

    currentGuess.split("").forEach((letter, index) => {

      const status = statuses[index];

      if (
        !updatedKeys[letter] ||
        priority[status] > priority[updatedKeys[letter]]
      ) {
        updatedKeys[letter] = status;
      }

    });

    setKeyStatus(updatedKeys);
    setCurrentGuess("");
    setMessage("");

    // Check game result
    if (currentGuess === solutionWord) {
      setGameStatus("WON");
    } else if (newGuesses.length === 6) {
      setGameStatus("LOST");
    }
  }

  // Handle physical and virtual keyboard input
  function handleKeyPress(key) {

    if (gameStatus !== "IN_PROGRESS") return;

    if (key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "BACKSPACE") {
      setCurrentGuess((prev) => prev.slice(0, -1));
      setMessage("");
      return;
    }

    if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + key);
      setMessage("");
    }
  }

  // Physical keyboard support
  useEffect(() => {

    function handleKeyDown(event) {

      if (event.key === "Enter") {
        event.preventDefault();
        handleKeyPress("ENTER");
      }

      else if (event.key === "Backspace") {
        event.preventDefault();
        handleKeyPress("BACKSPACE");
      }

      else if (/^[a-zA-Z]$/.test(event.key)) {
        handleKeyPress(event.key.toUpperCase());
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };

  }, [currentGuess, pastGuesses, gameStatus, keyStatus]);

  // Restart the game
  function restartGame() {
    setCurrentGuess("");
    setPastGuesses([]);
    setGameStatus("IN_PROGRESS");
    setKeyStatus({});
    setMessage("");
  }

  return (
    <div className="game">

      <h1>WORDLE</h1>
      <div className="game-info">
  <p className="hint">
    Hint: What keeps the doctor away?
  </p>

  <p className="instruction">
    Guess the five-letter word in six attempts.
  </p>
</div>

      {/* Game board */}
      <div className="board">

        {[0, 1, 2, 3, 4, 5].map((index) => {

          const guess = pastGuesses[index] ||
            (index === pastGuesses.length ? currentGuess : "");

          return (
            <Row
              key={index}
              guess={guess}
              submitted={Boolean(pastGuesses[index])}
              solutionWord={solutionWord}
            />
          );

        })}

      </div>

      {/* Error message */}
      <p>{message}</p>

      {/* Virtual keyboard */}
      <Keyboard
        onKeyPress={handleKeyPress}
        keyStatus={keyStatus}
      />

      {/* Game over popup */}
      {gameStatus !== "IN_PROGRESS" && (

        <div className="modal">

          <div className="modal-content">

            <h2>
              {gameStatus === "WON" ? "You Won!" : "Game Over!"}
            </h2>

            <p>
              The correct word was: <strong>{solutionWord}</strong>
            </p>

            <button onClick={restartGame}>
              Play Again
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;
