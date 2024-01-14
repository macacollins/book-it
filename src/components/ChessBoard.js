
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
                        dropOffBoard='snapback',
                        moveCallback=(move => {console.log("Got move", move)})
                   }) => {
    const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, '');
    // Initialize the board after the component mounts to the DOM
    useEffect(() => {
        setTimeout(() => {


            const game = new Chess(fen);

            function onDragStart (source, piece, position, orientation) {
                console.log("onDragStart called")

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
            function onDrop (source, target) {
                console.log("onDrop called")
                // see if the move is legal
                var move = game.move({
                    from: source,
                    to: target,
                    // promotion: 'q' // NOTE: always promote to a queen for example simplicity
                })

                // illegal move
                if (move === null) return 'snapback'

                updateStatus(move)
            }

            function updateStatus (move) {

                console.log("updateStatus called")

                var status = ''

                var moveColor = 'White'
                if (game.turn() === 'b') {
                    moveColor = 'Black'
                }

                // checkmate?
                if (game.in_checkmate) {
                    status = 'Game over, ' + moveColor + ' is in checkmate.'
                }

                // draw?
                else if (game.in_draw) {
                    status = 'Game over, drawn position'
                }

                // game still on
                else {
                    status = moveColor + ' to move'

                    // check?
                    if (game.in_check) {
                        status += ', ' + moveColor + ' is in check'
                    }
                }

                console.log(move, status)

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
            const board = Chessboard(finalID, config);

            if (!board) {
                return;
            }

            if (invert) {
                board.flip();
            }

            const domBoard = document.getElementById(finalID);

            if (!draggable) {
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