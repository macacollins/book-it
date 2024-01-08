
import Drawings from './Drawings';
import {useEffect} from 'react';

const ChessBoard = ({
                       name, game_url, invert = false, fen = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R', arrows = []
                   }) => {
    const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, '');
    // Initialize the board after the component mounts to the DOM
    useEffect(() => {
        setTimeout(() => {

            const config = {
                position: fen,
            }

            /*global Chessboard */
            console.log(finalID);
            const board = Chessboard(finalID, config);

            if (invert) {
                board.flip();
            }

            const box_size = 49
        }, 100);
    }, [fen]);

    return (
        <div>
            <Drawings arrows={arrows}> </Drawings>
            <div id={finalID} style={{"height": "388px", "width": "388px"}}>
            </div>
        </div>
    );
}

export default ChessBoard;