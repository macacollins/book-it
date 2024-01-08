
import Arrow from './Arrow';
import ChessBoard from './ChessBoard';

import '@material/web/list/list.js';

import '@material/web/list/list-item.js';

const AnalysisResult = ({analysisDatabase, game}) => {
    // display code stays under this line
    let analysis = analysisDatabase[game.url];

    if (!analysis) {
        return <md-list-item>
            <div slot="headline">
                Loading Analysis for game
                {game.url}
            </div>
        </md-list-item>
    }

    let arrows = analysis.arrows.map(arrow => <Arrow {...arrow} ></Arrow>);

    return <md-list-item>
        <div slot="headline">{analysis.headers.White}{' vs '}{analysis.headers.Black}{'\n'}
            {analysis.headers.Result}
        </div>
        <div slot="supporting-text">
            <div className="side-by-side">
                {'End Position'}
                <ChessBoard fen={analysis.displayFEN}
                            invert={analysis.invert_board}
                            name="my-board"
                            game_url={game.url}
                            arrows={arrows}></ChessBoard>
            </div>
            <div className="buttonlist">
                <md-text-button onClick={() => window.open(analysis.headers.Link)}>Chess.com</md-text-button>
                <md-text-button
                    onClick={() => window.open('https://lichess.org/analysis/' + analysis.displayFEN)}>Lichess
                    Analysis
                </md-text-button>
                <md-text-button
                    onClick={() => window.open('https://www.chessable.com/courses/fen/' + analysis.displayFEN)}>Chessable
                    Course Search
                </md-text-button>
                <br></br>
                {analysis.advice}
            </div>
        </div>
        <div slot="trailing-supporting-text">
        </div>
    </md-list-item>
}

export default AnalysisResult;