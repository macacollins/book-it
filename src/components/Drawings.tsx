// If we allow highlighting later we might wish to use this
// const Circle = ({x, y}) => {
//     //return <g><circle stroke="#15781B" stroke-width="0.0625" fill="none" opacity="1" cx="-0.5" cy="2.5" r="0.46875"></circle></g></g>
// }
import useWindowSize from "../hooks/useWindowSize";

const Drawings = ({arrows, circles}: any) => {

    const width = useWindowSize()[0];

    let widthOfChessboard = Math.min(width - 36, 513);

    let actualChessboardWidth =
        widthOfChessboard % 8 === 0 ?
            widthOfChessboard - 8 :
            widthOfChessboard - (widthOfChessboard % 8);

    let style = {
        height: actualChessboardWidth + "px",
        width: actualChessboardWidth + "px",
        // border: "0px"
    }

    let marker1Props = { "cgKey": "g2" };
    let marker2Props = { cgKey: "pb2" }

    return (
        <svg className="cg-shapes" style={style} viewBox="-4 -4 8 8" preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="cg-filter-blur">
                    <feGaussianBlur stdDeviation="0.019"></feGaussianBlur>
                </filter>
                <marker id="arrowhead-g" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05"
                        refY="2" {...marker1Props}>
                    <path d="M0,0 V4 L3,2 Z" fill="green"></path>
                </marker>
                <marker id="arrowhead-r" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05"
                        refY="2" {...marker2Props}>
                    <path d="M0,0 V4 L3,2 Z" fill="red"></path>
                </marker>
            </defs>
            {arrows}
            {circles}
        </svg>

    )
}

export default Drawings;