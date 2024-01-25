import Drawings from './Drawings';
import {useEffect, useState} from 'react';

import {Chess} from 'chess.js';
import useWindowSize from '../hooks/useWindowSize';

const ChessBoard = ({
                        name,
                        game_url,
                        invert = false,
                        fen = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R',
                        arrows = [],
                        draggable = false,
                        dropOffBoard = 'snapback',
                        madeMoveRef = {current: true},
                        moveCallback = (move => {
                            console.log("Got move", move)
                        }),
                        moves = []
                    }) => {

    const width = useWindowSize()[0];

    const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, '');

    const [board, setBoard] = useState(undefined);

    // Initialize the board after the component mounts to the DOM
    useEffect(() => {
        setTimeout(() => {
            const game = new Chess();

            function onDragStart(source, piece, position, orientation) {
                console.log("onDragStart called, madeMove = ", madeMoveRef);

                if (madeMoveRef.current) {
                    console.log("already made move");
                    return false;
                }

                // only pick up pieces for the side to move
                if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                    (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
                    return false
                }
            }

            // update the board position after the piece snap
            // for castling, en passant, pawn promotion
            function onSnapEnd() {
                board.position(game.fen())
            }

            function onDrop(source, target) {
                console.log("onDrop called")

                let move;

                try {
                    // see if the move is legal
                    move = game.move({
                        from: source,
                        to: target,
                        // promotion: 'q' // NOTE: always promote to a queen for example simplicity
                    });
                } catch (e) {
                    console.log("Invalid move attempted", e)
                    return 'snapback';
                }

                moveCallback(move);
            }

            const config = {
                position: fen,
                draggable: draggable,
                dropOffBoard,
                onDragStart,
                onDrop,
                onSnapEnd,
            }

            let board;

            try {
                /*global Chessboard */
                // TODO fork and react-ify this library
                board = Chessboard(finalID, config);

                setBoard(board);
            } catch (e) {
                // This fires sometimes when it does not affect the experience
                console.log("Got exception", e)
            }

            function makeMoves(moves) {
                if (moves.length) {
                    setTimeout(() => {
                        // console.log("Moving", moves);

                        // console.log("Trying singleMove", singleMove);

                        let singleMove;
                        try {
                            singleMove = game.move(moves[0]);

                            // board.move(`${singleMove.from}-${singleMove.to}`);
                            board.position(game.fen())
                        } catch (e) {

                            // This "shouldn't" ever happen
                            // In the real world this is a good place to log for debugging
                            console.debug("Unable to make move", singleMove, " on board", game, e)
                        }
                        makeMoves(moves.slice(1));
                    }, 250);
                }
            }

            if (!board) {
                return;
            }

            setTimeout(() => {
                makeMoves(moves);
            }, 200);

            if (invert) {
                board.flip();
            }

            // Turn off mobile scrolling behavior if they drag inside the board on mobile
            const domBoard = document.getElementById(finalID);

            if (draggable) {
                function preventBehavior(e) {
                    e.preventDefault();
                }

                domBoard.addEventListener("touchmove", preventBehavior, {passive: false});
            }

        }, 100);

        // If you take out the dependency array, it remakes the board each time
        // eslint-disable-next-line
    }, [fen, finalID, invert]);

    // Resize when the window changes width
    useEffect(() => {
            if (board) {
                board.resize()
            }

        },
        // We don't care about the dependency on board; it won't be re-set with the current code
        // eslint-disable-next-line
        [width]);

    let drawings = <Drawings arrows={arrows}> </Drawings>

    // let widthOfChessboard = width - 36;
    let widthOfChessboard = Math.min(width - 36, 513);

    let style = {
        height: widthOfChessboard + "px",
        width: widthOfChessboard + "px",
    }

    return (
        <div className="side-by-side">
            {drawings}
            <div id={finalID} style={style}>
            </div>
        </div>
    );
}

export default ChessBoard;