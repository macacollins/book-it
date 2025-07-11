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
import { getGameByID, getItemDexie } from "../storage";
import pgnParser, { ParsedPGN, parse } from "pgn-parser";
import getKeyValueHeaders from "../pgn/getKeyValueHeaders";

const makeKey = (master: string, id: string) => master + "-" + id + "-annotations";

const HORIZONTAL_CONTROLS_KEY = "ANNOTATIONS_HORIZONTAL_CONTROLS";
const BOARD_SIZE_KEY = "ANNOTATIONS_BOARD_SIZE";

function saveAnalysis(id, notes) {
    const key = makeKey("morphy", id);

    localStorage.setItem(key, JSON.stringify(notes));
} 

function retrieveAnalysis(id) {
    const key = makeKey("morphy", id);

    const currentValue = localStorage.getItem(key);

    if (currentValue) {
        return JSON.parse(currentValue);
    }   

    return {}
}

export default function MasterGameAnnotations() {

    const width = useWindowSize()[0];

    // should be a LichessGame or similar
    const [ currentTextBoxValue, setCurrentTextBoxValue ] = useState<string>();

    const [ parsedPGN, setParsedPGN ] = useState<ParsedPGN>();
    const moves = parsedPGN?.moves?.map(move => move.move);
    const { id } = useParams();

    const kvHeaders = parsedPGN && getKeyValueHeaders(parsedPGN);

    useEffect(() => {

        async function getGame() {
            const morphyGames = await getItemDexie("morphyGames");

            if (morphyGames.length >= id) {
                setParsedPGN(morphyGames[id]);
            }
        }

        id && getGame();
    }, []);

    const [ notes, setNotes ] = useState(retrieveAnalysis(id));

    useEffect(() => {
        saveAnalysis(id, notes);
    }, [notes]);

    const chess = new Chess();
    const fens = 
        moves?.map((move: any) => {
            chess.move(move);
            return chess.fen();
        })

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


    console.log("Will be using", finalBoardSize, " as the board size. board width: ", boardWidth);


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
                            console.log("ChessboardRef", chessboardRef);
                            if (chessboardRef.current) {
                                chessboardRef.current.resize();
                            }
                        }, 10);
                    } 

                    } width="20rem" max={512} min={128}/>
                    {kvHeaders && `${kvHeaders.White} vs. ${kvHeaders.Black} ${kvHeaders.Event} ${kvHeaders.Date}`}
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
            </SplitterPanel>

        </Splitter>
    });

    return parsedPGN ? boards[currentPosition] : id ? id : "No ID found.";
}