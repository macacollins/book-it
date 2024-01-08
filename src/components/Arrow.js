
const Arrow = ({fromX, fromY, destX, destY, color = 'red'}) => {

    const targetX1 = fromX - 4.5;
    const targetX2 = destX - 4.5;
    const targetY1 = 4.5 - fromY;
    const targetY2 = 4.5 - destY;

    const markerEnd = color === 'red' ? 'url(#arrowhead-r)' : 'url(#arrowhead-g)';

    return <g>
        <g>
            <line stroke={color} stroke-width="0.15625" stroke-linecap="round" marker-end={markerEnd} opacity="1"
                  x1={targetX1} y1={targetY1} x2={targetX2} y2={targetY2}></line>
        </g>
    </g>

    // return <g><g><line id="test-id" stroke="#15781B" stroke-width="0.15625" stroke-linecap="round" marker-end="url(#arrowhead-g)" opacity="1" d={"M -0.5 2.5 L -0.5 0.65625 z"}></line></g></g>
};

export default Arrow