import { ArrowConfig } from "../types/ArrowConfig";

const Arrow = ({fromX, fromY, destX, destY, index= 0, color, hidden}: ArrowConfig & { index: number, hidden: boolean }) => {

    const targetX1 = fromX - 4.5;
    const targetX2 = destX - 4.5;
    const targetY1 = 4.5 - fromY;
    const targetY2 = 4.5 - destY;

    // These ids are defined in Drawings.jsx
    const markerEnd = color === 'red' ? 'url(#arrowhead-r)' : 'url(#arrowhead-g)';

    let opacity = hidden ? 0 : 1;

    let key = `${index}${fromX}${fromY}${destX}${destY}`;

    return <g key={key}>
            <line opacity={opacity} stroke={color} strokeWidth="0.15625" strokeLinecap="round" markerEnd={markerEnd}
                  x1={targetX1} y1={targetY1} x2={targetX2} y2={targetY2}></line>
        </g>
};

export default Arrow
