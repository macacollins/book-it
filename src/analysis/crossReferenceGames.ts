import { Chess } from "chess.js";
import { GradualRepertoire, SavedGame, SavedGameClient } from "../database";

export interface GameMatch {
    gradualRepertoire: GradualRepertoire;
    game: SavedGame;
    longestMatch: SAN[]; // SAN of moves
    nextGameMove: SAN | undefined;
    nextRepertoireMoves: SAN[];
    fen: FEN;
}

// For this file, FEN should be the position only, not using the pawn moves fields. This is to allow matches by transposition.
type FEN = string;

// We can do better, but probably not for today.
type SAN = string;

// Record of FEN to line
type FENMap = Record<FEN, string[]>;

export default async function crossReferenceGames(
    repertoire: GradualRepertoire,
): Promise<GameMatch[]> {
    const fenMap = createFENMap(repertoire);
    const games = await SavedGameClient.getAll();

    return games.flatMap((game) => {
        const match = matchSingleGame(fenMap, game, repertoire);
        return match.longestMatch.length > 0 ? [{ ...match, game }] : [];
    });
}

export function createFENMap(repertoire: GradualRepertoire): FENMap {
    let fens: Record<FEN, string[]> = {}
    const prefixFENs = new Map<string, string>([["[]", repertoire.startingFEN]]);

    for (const line of repertoire.lines) {
        let prefixLength = line.length;
        while (prefixLength > 0 && !prefixFENs.has(prefixKey(line, prefixLength))) {
            prefixLength--;
        }

        const chess = new Chess(prefixFENs.get(prefixKey(line, prefixLength)));
        for (let index = prefixLength; index < line.length; index++) {
            try {
                chess.move(line[index]);
            } catch {
                break;
            }

            prefixFENs.set(prefixKey(line, index + 1), chess.fen());
            const fen: FEN = normalizeFEN(chess.fen()) as FEN;
            fens[fen] = line;
            console.log(chess.history(), "awef")
        }
    }

    return fens;
}

export function matchSingleGame(fens: FENMap, game: SavedGame, gradualRepertoire: GradualRepertoire): GameMatch {
    let longestMatch: SAN[] = [];
    let nextGameMove: SAN | undefined;
    let nextRepertoireMoves: SAN[] = [];
    const chess = new Chess();

    try {
        chess.loadPgn(game.pgn);
    } catch {
        return { longestMatch, fen: normalizeFEN(chess.fen()) } as GameMatch;
    }

    const history = chess.history({ verbose: true });
    let fen = history.length > 0
        ? normalizeFEN(history[0].before)
        : normalizeFEN(chess.fen());

    for (const [index, move] of history.entries()) {
        const moveFEN = normalizeFEN(move.after);
        if (!fens[moveFEN]) {
            continue;
        }

        const movesToPosition = chess.history().slice(0, index + 1);
        if (movesToPosition.length > longestMatch.length) {
            fen = moveFEN;
            longestMatch = fens[fen];
            nextGameMove = chess.history().slice(index + 1)?.[0]
            
            const repertoireCalculationChess = new Chess(moveFEN);
            console.log(repertoireCalculationChess.moves());
            nextRepertoireMoves = []
            for (let move of repertoireCalculationChess.moves()) {
                const innerChess = new Chess(moveFEN);
                const innerMove = innerChess.move(move, { strict: false });
                const innerFEN = innerMove.after;
                if (fens[normalizeFEN(innerFEN)]) {
                    console.log("Pushing a move ")
                    nextRepertoireMoves.push(move);
                }
                const innerFEN2 = innerMove.before;

            }
        }
    }

    return { longestMatch, fen, gradualRepertoire, game, nextGameMove, nextRepertoireMoves };
}

function normalizeFEN(fen: string): FEN {
    return fen.split(" ").slice(0, 4).join(" ");
}

function prefixKey(line: SAN[], length: number): string {
    return JSON.stringify(line.slice(0, length));
}