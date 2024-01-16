
import Drawings from './Drawings';
import {useEffect} from 'react';

import {Chess} from 'chess.js';

const ChessBoard = ({
                       name,
                        game_url,
                        invert = false,
                        fen = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R',
                        arrows = [],
                        draggable = false,
                        dropOffBoard= 'snapback',
                        madeMoveRef = { current: true },
                        moveCallback=(move => {console.log("Got move", move)}),
                        moves = []
                   }) => {
    const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, '');

    // Initialize the board after the component mounts to the DOM
    useEffect(() => {
        setTimeout(() => {
            const game = new Chess();

            function onDragStart (source, piece, position, orientation) {
                console.log("onDragStart called, madeMove = ", madeMoveRef);

                if (madeMoveRef.current) {
                    console.log("already made move");
                    return false;
                }

                // do not pick up pieces if the game is over
                if (game.game_over) return false

                // only pick up pieces for the side to move
                if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                    (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
                    return false
                }
            }
            // update the board position after the piece snap
            // for castling, en passant, pawn promotion
            function onSnapEnd () {
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

                // illegal move
                if (!move) return 'snapback'

                moveCallback(move)

            }

            const config = {
                position: fen,
                draggable: draggable,
                dropOffBoard,
                onDragStart,
                onDrop,
                onSnapEnd,
            }

            /*global Chessboard */
            // TODO fork and react-ify this library
            const board = Chessboard(finalID, config);

            function makeMoves(moves) {
                if (moves.length) {
                    setTimeout(() => {
                        // console.log("Moving", moves);

                        let singleMove = game.move(moves[0]);
                        // console.log("Trying singleMove", singleMove);

                        try {
                            board.move(`${singleMove.from}-${singleMove.to}`);
                        } catch (e) {
                            console.log("Unable to make move", singleMove, " on board", game, e)
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
    }, [fen, finalID, invert]);

    let drawings = <Drawings arrows={arrows}> </Drawings>

    return (
        <div className="side-by-side">
            {drawings}
            <div id={finalID} style={{"height": "294px", "width": "294px"}}>
            </div>
        </div>
    );
}

export default ChessBoard;