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


const makeKey = (id: string) => id + "-annotations";

function saveAnalysis(id, notes) {
    const key = makeKey(id);

    localStorage.setItem(key, JSON.stringify(notes));

} 

function retrieveAnalysis(id) {
    const key = makeKey(id);

    const currentValue = localStorage.getItem(key);

    if (currentValue) {
        return JSON.parse(currentValue);
    }   

    return {}
}


export default function Annotations() {

    const width = useWindowSize()[0];


    const urlParams = new URLSearchParams(window.location.search);
    const gameURL = urlParams.get('gameURL');

    const urlParts = gameURL?.split("/") || ["nothing found here"]
    const id = urlParts[urlParts.length - 1];

    // should be a LichessGame or similar
    const [ game, setGame ] = useState<any>();
    const [ currentTextBoxValue, setCurrentTextBoxValue ] = useState<string>();

    const moves = game?.moves?.split(" ");

    useEffect(() => {

        const url = `https://lichess.org/game/export/${id}`;
        console.log("Fetching url:", url);
        fetch(url, {
            headers: {
              Accept: "application/json"
            }
        })
            .then(response => response.json())
            .then(json => {
                console.log("Got json", json);
                setGame(json);
            })

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
    const [ boardWidth, setBoardWidth ] = useState(width > 512 ? 512 : width < 128 ? 128 : width)

    const [ showControls, setShowControls ] = useState(true);

    useEffect(() => {
        setBoardWidth(width > 512 ? 512 : width < 128 ? 128 : width);
    }, [width])

    const boards = fens?.map((fen, index) => {
        return <Splitter layout="vertical" onDoubleClickCapture={() => setShowControls(!showControls)}>
            <SplitterPanel>
                <ChessBoard chessboardRef={chessboardRef} name={"test" + index} game_url={"url" + index} fen={fen} size={`${boardWidth}px`}/>
            </SplitterPanel>
            <SplitterPanel className="flex flex-column">
                <div>
                    {showControls && <><div className="flex gap-1">
                    <Button severity="secondary" label="last" onClick={lastMove}/>
                    <Button severity="secondary" label="next" onClick={nextMove}/>
                    <Button severity="secondary" label="analysis" onClick={() => {
                        window.open(`https://lichess.org/analysis/${fen}`, "_blank")
                    }} />

                    <Button severity="secondary" label="game" onClick={() => {
                        window.open(`https://lichess.org/${id}`, "_blank")
                    }} />
                    </div>
                    <div className="m-2">
                    <Slider value={boardWidth} onChange={(e) => {
                        setBoardWidth(e.value);
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
            </SplitterPanel>

        </Splitter>
    });

    return game ? boards[currentPosition] : id
}