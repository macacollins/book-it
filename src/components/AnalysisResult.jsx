import Arrow from './Arrow';
import ChessBoard from './ChessBoard';

import '@material/web/list/list.js';

import '@material/web/list/list-item.js';
import useWindowSize from "../hooks/useWindowSize";

const AnalysisResult = ({analysisDatabase, game, index, nameOverride = "my-name"}) => {
    const width = useWindowSize()[0];

    if (typeof game === "undefined") {
        return <md-list-item key={index}>
            <div slot="headline">
                Loading Analysis for game
                {game}
            </div>
        </md-list-item>
    }

    // display code stays under this line
    let analysis = analysisDatabase[game.url];

    if (!analysis) {
        return <md-list-item key={index}>
            <div slot="headline">
                Loading Analysis for game
                {game.url}
            </div>
        </md-list-item>
    }

    let arrows = analysis.arrows.map(arrow => <Arrow {...{index, ...arrow}} ></Arrow>);

    const path = new URL(analysis.headers.ECOUrl).pathname;

    // Get the last path segment and replace hyphens with spaces
    const openingName = path.split('/').pop().replace(/-/g, ' ');

    // console.log("Opening was", openingName);



    let widthOfChessboard = Math.min(width - 36, 513);

    let actualChessboardWidth =
        widthOfChessboard % 8 === 0 ?
            widthOfChessboard - 8 :
            widthOfChessboard - (widthOfChessboard % 8);

    let buttonStyles = {
        "width": actualChessboardWidth + "px"
    }

    return <md-list-item key={index}>
        <div slot="headline">{analysis.headers.White}{' vs '}{analysis.headers.Black}{'\n'}
            {analysis.headers.Result}
        </div>
        <div slot="supporting-text">
            <div className="side-by-side">
                {analysis.advice}
                <p>{analysis.headers.ECO} {openingName}</p>
                <ChessBoard fen={analysis.displayFEN}
                            invert={analysis.invert_board}
                            name={nameOverride}
                            game_url={game.url}
                            arrows={arrows}></ChessBoard>
            </div>
            <br></br>
            <div className="buttonlist" style={buttonStyles}>
                <md-text-button
                    data-testid={"chess-dot-com-button"}
                    onClick={() => window.open(analysis.headers.Link)}>
                    Chess.com
                </md-text-button>
                <md-text-button
                    data-testid={"lichess-button"}
                    onClick={() => window.open('https://lichess.org/analysis/' + analysis.displayFEN)}>Lichess

                </md-text-button>
                <md-text-button
                    data-testid={"chessable-button"}
                    onClick={() => window.open('https://www.chessable.com/courses/fen/' + analysis.displayFEN)}>Chessable
                </md-text-button>
                <br></br>

            </div>
        </div>
    </md-list-item>
}

export default AnalysisResult;