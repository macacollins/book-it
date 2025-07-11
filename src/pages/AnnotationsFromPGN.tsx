import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ChessBoard from "../components/ChessBoard";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { Slider } from "primereact/slider";
import useWindowSize from "../hooks/useWindowSize";
import { ParsedPGN } from "pgn-parser";
import { Badge } from "primereact/badge";

const makeKey = (id: string) => "annotations" + id;

const HORIZONTAL_CONTROLS_KEY = "ANNOTATIONS_HORIZONTAL_CONTROLS";
const BOARD_SIZE_KEY = "ANNOTATIONS_BOARD_SIZE";
const WORD_COUNTS_KEY = "word-counts";

function getCurrentWordCounts(): Record<string, number> {
    const wordCounts = localStorage.getItem(WORD_COUNTS_KEY);
    if (wordCounts) {
        return JSON.parse(wordCounts);
    } else {
        localStorage.setItem(WORD_COUNTS_KEY, '{}');
        return {}
    }
}

function saveAnalysis(id: string, notes: Record<string, any>) {

    const key = makeKey(id);

    localStorage.setItem(key, JSON.stringify(notes));

    const count = Object.values(notes).join(" ").split(" ").length;
    // console.log("Saving", count, "words.")

    // Here, we are gonna update the word counter. 
    // Not a perfect system but a proof of concept

    const wordCounts = localStorage.getItem(WORD_COUNTS_KEY);

    if (wordCounts) {
        try {
            const objectVersion = JSON.parse(wordCounts);

            objectVersion[key] = count;
            localStorage.setItem(WORD_COUNTS_KEY, JSON.stringify(objectVersion))

        } catch (e) {
            console.log(e);
        }
    } else {
        const initialObject = { [key]: count };

        localStorage.setItem(WORD_COUNTS_KEY, JSON.stringify(initialObject))
    }
} 

function retrieveAnalysis(id: string) {
    const key = makeKey(id);

    const currentValue = localStorage.getItem(key);

    if (currentValue) {
        return JSON.parse(currentValue);
    }   

    return {}
}


export default function Annotations({ pgn, onClose } : { pgn: ParsedPGN, onClose: () => void }) {

    const width = useWindowSize()[0];

    // should be a LichessGame or similar
    const [ currentTextBoxValue, setCurrentTextBoxValue ] = useState<string>();

    const moves: string[] = pgn.moves.map(move => move.move);

    // console.log("Starting pgn annotation with moves of ", moves);

    const chess = new Chess();
    const fens = 
        moves?.map((move: string) => {
            chess.move(move, { strict: false });
            return chess.fen();
        })

    let lastFEN = fens[fens.length - 1];

    const [ notes, setNotes ] = useState(retrieveAnalysis(lastFEN));
    const [ showPGN, setShowPGN ] = useState(false);


    useEffect(() => {
        setNotes(retrieveAnalysis(lastFEN))
    }, [lastFEN]);

    const wordCount = getCurrentWordCounts();

    let total = Object.values(wordCount).reduce((a: number, b: number) => a + b, 0);
    const thisWordCount = wordCount[makeKey(lastFEN)] || 0;

    useEffect(() => {
        console.log("Trying to update notes for", lastFEN);
        saveAnalysis(lastFEN, notes);
    }, [notes]);

    const [ currentPosition, setCurrentPosition ] = useState(1);

    const nextMove = () => {
        if (currentPosition < fens.length - 1) {
            setCurrentPosition(currentPosition + 1);
            setCurrentTextBoxValue(notes[fens[currentPosition + 1]] || "")
        }
    };

    const lastMove = () => {
        if (currentPosition > 0) {
            setCurrentPosition(currentPosition - 1);
            setCurrentTextBoxValue(notes[fens[currentPosition - 1]] || "")
        }
    }

    const chessboardRef = useRef<any>(null);

    const defaultBoardSize = width > 512 ? 512 : width < 128 ? 128 : width
    const storedBoardSize = localStorage.getItem(BOARD_SIZE_KEY);

    // debugger;
    let finalBoardSize = defaultBoardSize;
    try {
        if (storedBoardSize !== undefined && Number(storedBoardSize)) {
            const numberVersion = Number(storedBoardSize);
            if (numberVersion >= 128 && numberVersion < 513) {
                finalBoardSize = numberVersion;
            }
        } 
    } catch (e) {
        console.log("WOW WHAT HAPPENED", e);
    }

    const [ boardWidth, setBoardWidth ] = useState(finalBoardSize);
    const [ firstWidthIgnored, setFirstWidthIgnored ] = useState(false);

    // console.log("Will be using", finalBoardSize, " as the board size. board width: ", boardWidth);
    const [ showControls, setShowControls ] = useState(true);

    useEffect(() => {
        if (width > 0 ) { 
            if (firstWidthIgnored) {
                setBoardWidth(defaultBoardSize);
                console.log("Set board width to ", defaultBoardSize);

            } else {
                console.log("Skipping the first resize")
                setFirstWidthIgnored(true);
            }
        }
    }, [width])
    
    const [ horizontalOn, setHorizontalOn ] = useState(localStorage.getItem(HORIZONTAL_CONTROLS_KEY) === "true");

    const levels = [0, 300, 900, 2700, 6500, 13000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 195000, 225000, 265000, 305000, 355000]

    function countLevels(words: number): number {
        return levels.filter(level => level <= words).length;
    }
    
    function countXPToNextLevel(words: number) {
        const nextLevel = levels.filter(level => level > words)[0];
        return nextLevel - words;
    }

    const otherWordCount = Object.values(notes).join(" ").split(" ").length;

    const boards = fens?.map((fen, index) => {
        return <Splitter layout="vertical">
            <SplitterPanel className="flex flex gap-3 align-items-center justify-content-center">
        
                {horizontalOn && <Button severity="secondary" label="<" onClick={lastMove}/> }
                <ChessBoard chessboardRef={chessboardRef} name={"test" + index} game_url={"url" + index} fen={fen} size={`${boardWidth}px`}/>
                {horizontalOn && <Button severity="secondary" label=">" onClick={nextMove}/> }

            </SplitterPanel>
            <SplitterPanel className="flex flex-column">
                <div>
                    {showControls && <><div className="flex gap-1 justify-content-center">
                    <Button severity="secondary" label="<" onClick={lastMove}/>
                    <Button severity="secondary" label=">" onClick={nextMove}/>
                    <Button severity="secondary" label="?" onClick={() => {
                        window.open(`https://lichess.org/analysis/${fen}`, "_blank")
                    }} />

                    <Button severity="secondary" label="l" onClick={() => {
                        window.open(`https://lichess.org/${id}`, "_blank")
                    }} />

                    <Button severity="secondary" label="h" onClick={() => {
                        setShowControls(false);
                    }} />

                    <Button severity="secondary" label="c" onClick={() => {
                        const newValue = !horizontalOn;
                        setHorizontalOn(newValue);
                        localStorage.setItem(HORIZONTAL_CONTROLS_KEY, "true");
                    }} />
                    </div>
                    <div className="m-2">
                    <Slider value={boardWidth} onChange={(e) => {
                        setBoardWidth(e.value);
                        localStorage.setItem(BOARD_SIZE_KEY, "" + e.value);
                        setTimeout(() => {
                            console.log("ChessboardREf", chessboardRef);
                            if (chessboardRef.current) {
                                chessboardRef.current.resize();
                            }
                        }, 10);
                    } 

                    } max={512} min={128}/>
                </div></>}
                    <InputTextarea 
                        rows={5} 
                        id={"id" + index}
                        className="w-full" 
                        value={currentTextBoxValue} 
                        onChange={(e) => {
                            setNotes({...notes, [fen]: e.target.value});
                            setCurrentTextBoxValue(e.target.value);
                        }} />
                </div>
                <div>
                    <Button label="Close" onClick={onClose} />
                    <Button label="Show" onClick={() => setShowPGN(!showPGN)} />
                    {thisWordCount > 1000 ? <Badge value="1000+" severity="success"></Badge> : ''}
                </div>
                <div>
                    {thisWordCount} words this game
                    <br></br>
                    {total} words Total
                    <br></br>
                    Level {countLevels(total)}
                    <br></br>
                    XP remaining {countXPToNextLevel(total)}
                </div>
                <div>
                    <pre>{JSON.stringify(pgn.headers, undefined, 2)}</pre>
                </div>
                {showPGN &&
                    <pre style={{width: boardWidth}}>
                        {JSON.stringify(notes, undefined, 2)}
                    </pre>
                }
            </SplitterPanel>
        </Splitter>
    });

    return boards[currentPosition]
}