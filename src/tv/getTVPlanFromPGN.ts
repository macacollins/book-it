import pgnParser, { ParsedPGN } from "pgn-parser";
import { TVPlan, TimedMove } from "../types/TVPlan";

export default function getTVPlan(inputPGN: ParsedPGN): TVPlan {
  console.log(inputPGN);

  let timeControlBase = 0,
    timeControlIncrement = 0;

  inputPGN?.headers?.forEach((header: pgnParser.Header) => {
    if (header.name === "TimeControl") {
      [timeControlBase, timeControlIncrement] = header.value
        .split("+")
        .map(Number);
    }
  });

  //debugger;

  let blackClockElapsed = timeControlIncrement,
    whiteClockElapsed = timeControlIncrement;

  let duration = inputPGN.moves.length * timeControlIncrement + timeControlBase;

  const newMoves: TimedMove[] = inputPGN.moves.map(
    (move: pgnParser.Move, index: number) => {
      let time;
      try {
        // @ts-expect-error yah
        time = move.comments[0]?.commands[0]?.values[0];
      } catch (e) {
        debugger;
      }

      try {
        if (!time) {
          // @ts-expect-error yah
          const moveText = move.comments[0].text;
          const results = /.*%clk ([0]+:[0-9][0-9]:[0-9][0-9]).*/g.exec(
            moveText
          );
          time = results && results.length > 1 ? results[1] : undefined;
        }
        
      } catch (e) {
        debugger;
      }

      if (!time) {
        debugger;
        return {
          timeString: "Not available",
          numberSeconds: 3,
          move: move.move,
          player: "white",
          whiteClockSeconds: whiteClockElapsed,
          blackClockSeconds: blackClockElapsed,
        };
      }

      const [hour, minute, second] = time.split(":").map(Number);

      const totalTimeWithIncrements =
        timeControlBase + Math.round(index / 2) * timeControlIncrement;

      const totalCurrent = hour * 60 * 60 + minute * 60 + second;

      const elapsedSeconds = totalTimeWithIncrements - totalCurrent;

      let numberSeconds;
      if (index % 2 == 1) {
        // white
        numberSeconds = blackClockElapsed + elapsedSeconds;
        whiteClockElapsed = elapsedSeconds;
      } else {
        // black
        blackClockElapsed = elapsedSeconds;
        numberSeconds = whiteClockElapsed + elapsedSeconds;
      }

      if (index === inputPGN.moves.length - 1) {
        duration = numberSeconds + 10; // End of game stay for 10 seconds
      }

      return {
        timeString: time,
        numberSeconds: numberSeconds,
        move: move.move,
        player:
          move.move_number && move.move_number % 2 === 0 ? "black" : "white",
        whiteClockSeconds: whiteClockElapsed,
        blackClockSeconds: blackClockElapsed,
      };
    },
  );

  console.log("Returning a new tv plan.");
  return {
    moves: newMoves,
    originalPGN: inputPGN,
    startTime: new Date().getTime(),
    totalDuration: duration,
    timeControlBase,
    timeControlIncrement,
    // totalDuration: 5
  };
}
