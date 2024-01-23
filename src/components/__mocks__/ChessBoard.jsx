

let lastMoveCallback;
let lastProps;

export function getLastProps() {
    return lastProps;
}

const ChessBoard = (props) => {
    lastProps = props;
    return ""
}

export default ChessBoard;