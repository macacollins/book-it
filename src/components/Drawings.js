// If we allow highlighting later we might wish to use this
// const Circle = ({x, y}) => {
//     //return <g><circle stroke="#15781B" stroke-width="0.0625" fill="none" opacity="1" cx="-0.5" cy="2.5" r="0.46875"></circle></g></g>
// }
const Drawings = ({arrows, circles}) => {

    return (
        <svg className="cg-shapes" viewBox="-4 -4 8 8" preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="cg-filter-blur">
                    <feGaussianBlur stdDeviation="0.019"></feGaussianBlur>
                </filter>
                <marker id="arrowhead-g" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05"
                        refY="2" cgKey="g2">
                    <path d="M0,0 V4 L3,2 Z" fill="green"></path>
                </marker>
                <marker id="arrowhead-r" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05"
                        refY="2" cgKey="pb2">
                    <path d="M0,0 V4 L3,2 Z" fill="red"></path>
                </marker>
            </defs>
            {arrows}
            {circles}
        </svg>

    )
}

export default Drawings;