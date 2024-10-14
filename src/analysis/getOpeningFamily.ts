import { ParsedPGN } from "pgn-parser";

// Based on the full text of the opening name, guess the family
const openings = [
  "Alekhine's Defense",
  "Benko Gambit",
  "Benoni Defense",
  "Bird's Opening",
  "Bogo-Indian Defense",
  "Budapest Gambit",
  "Catalan Opening",
  "Caro-Kann Defense",
  "Chigorin",
  "Colle System",
  "Dutch Defense",
  "Giuoco Piano",
  "English Opening",
  "Evans Gambit",
  "Englund Gambit",
  "Four Knights Game",
  "French Defense",
  "Grünfeld Defense",
  "Italian Game",
  "King's Gambit",
  "King's Indian Attack",
  "King's Indian Defense",
  "King's Pawn Game",
  "London System",
  "Modern Defense",
  "Nimzo-Indian Defense",
  "Nimzowitsch Defense",
  "Petrov's Defense",
  "Philidor's Defense",
  "Pirc Defense",
  "Queen's Pawn Game",
  "Queen's Gambit Accepted",
  "Queen's Gambit Declined",
  "Queen's Indian Defense",
  "Réti Opening",
  "Ruy Lopez",
  "Scandinavian Defense",
  "Scotch Game",
  "Sicilian Defense",
  "Slav Defense",
  "Torre Attack",
  "Two Knights Defense",
  "Vienna Game",
  "Wade Defense",
  "Unknown",
];

// Address some inconsistencies in spelling
const alternates: {
  [key: string]: string[];
} = {
  "Caro-Kann Defense": ["Caro Kann"],
  "Queen's Gambit Declined": ["Queens Gambit Declined"],
  "Réti Opening": ["Reti"],
};

// Get the shorter name of the family rather than the full variation
// This allows more grouping of similar openings
export default function getOpeningFamily(name: string, pgn: ParsedPGN) {
  for (let opening of openings) {
    if (name.indexOf(opening) !== -1) {
      // If the main entry matches, just return it
      return opening;
    } else if (opening in alternates) {
      // Otherwise, check the alternative names
      for (let alternativeName of alternates[opening]) {
        if (name.indexOf(alternativeName) !== -1) {
          return opening;
        }
      }
    }
  }

  // Didn't find it based on the URL. Go thru each opening and compare
  // TODO switch to a tree structure for better lookup performance
  let moves = pgn.moves.map((move) => move.move);

  let maxScore = 0;
  let result = "Unknown";

  for (let opening in openingMoves) {
    const movesToMatch: string[] = openingMoves[opening];

    if (maxScore > movesToMatch.length) {
      // No need
      continue;
    }

    let match = true;
    for (let index = 0; index < movesToMatch.length; index++) {
      if (moves[index] !== movesToMatch[index]) {
        console.log("No match");
        match = false;
        break;
      }
    }

    if (match) {
      result = opening;
      maxScore = movesToMatch.length;
      console.log("Got a match finally");
    }
  }

  return result;
}

// This is naive, but at least will give something more than an ECO code
// Need to handle transpositions and systems better
const openingMoves: { [key: string]: string[] } = {
  "Alekhine's Defense": ["e4", "Nf6"],
  "Benko Gambit": ["d4", "Nf6", "c4", "c5", "d5", "b5"],
  "Benoni Defense": ["d4", "Nf6", "c4", "c5"],
  "Bird's Opening": ["f4"],
  "Bogo-Indian Defense": ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+"],
  "Budapest Gambit": ["d4", "Nf6", "c4", "e5"],
  "Catalan Opening": ["d4", "Nf6", "c4", "e6", "g3"],
  "Caro-Kann Defense": ["e4", "c6"],
  Chigorin: ["d4", "d5", "Nf3", "Nc6"],
  // Tricky Tricky
  // "Colle System": [ ""]
  "Dutch Defense": ["d4", "f5"],
  "Giuoco Piano": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
  "English Opening": ["c4"],
  "Englund Gambit": ["d4", "e5"],
  "Evans Gambit": ["e4", "e5", "Nc6", "Bc4", "Bc5", "b4"],
  "Four Knights Game": ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
  "French Defense": ["e4", "e6"],
  "Grünfeld Defense": ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
  "Italian Game": ["e4", "e5", "Nf3", "Nc6"],
  "King's Gambit": ["e4", "e5", "f4"],
  // TODO Figure out how to support systems
  // "King's Indian Attack" :
  // "King's Indian Defense" :
  "King's Pawn Game": ["e4"],
  // Oof
  "London System": ["d4", "d5", "Nf3", "Nf6", "Bf4"],
  "Modern Defense": ["e4", "g6"],
  "Nimzo-Indian Defense": ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
  "Nimzowitsch Defense": ["e4", "Nc6"],
  "Petrov's Defense": ["e4", "e5", "Nf3", "Nf6"],
  "Philidor's Defense": ["e4", "e5", "Nf3", "d6"],
  "Pirc Defense": ["e4", "d6"],
  "Queen's Pawn Game": ["d4"],
  "Queen's Gambit Accepted": ["d4", "d5", "c4", "dxc4"],
  "Queen's Gambit Declined": ["d4", "d5", "c4", "e6"],
  "Queen's Indian Defense": ["d4", "Nf6", "c4", "e6", "Nf3", "b6"],
  // The 3 move variation is more proper, but the shorter Nf3 is better for me
  // "Réti Opening": [ "Nf3", "d5", "c4" ],
  "Réti Opening": ["Nf3"],
  "Ruy Lopez": ["e4", "e5", "Nf3", "Nc6", "Bb5"],
  "Scandinavian Defense": ["e4", "d5"],
  "Scotch Game": ["e4", "e5", "Nf3", "Nc6"],
  "Sicilian Defense": ["e4", "c5"],
  "Slav Defense": ["d4", "d5", "c4", "c6"],
  "Torre Attack": ["d4", "Nf6", "Nf3", "e6"],
  "Two Knights Defense": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
  "Vienna Game": ["e4", "e5", "Nc3"],
  "Wade Defense": ["d4", "d6", "Nf3", "Bg4"],
  Unknown: [],
};
