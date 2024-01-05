import logo from './logo.svg';
import './App.css';

import { useEffect } from 'react';

// index.js
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

function App() {
  return (
      <>

        <md-list>
          <md-list-item type="button">
            <div slot="headline">***REMOVED*** vs. Opponent</div>
            <div slot="supporting-text">
              <div className="side-by-side">
                  {'In this position, you played this move'}
                  <TestBoard name="my-board" arrows={"a7-a6"}></TestBoard>
              </div>
      {/*
              <div className="side-by-side">
                  {'Your book has this move'}
                  <TestBoard name="my-second-board"></TestBoard>
              </div>
              */}
            </div>
            <div slot="trailing-supporting-text">You left book</div>
          </md-list-item>
          <md-list-item type="button">
            <div slot="headline">Banana</div>
            <div slot="supporting-text">In stock</div>
            <div slot="trailing-supporting-text">56</div>
          </md-list-item>
          <md-list-item type="button">
            <div slot="headline">Cucumber</div>
            <div slot="supporting-text">Low stock</div>
            <div slot="trailing-supporting-text">5</div>
          </md-list-item>
        </md-list>

        <label>
          Material 3
          <md-checkbox checked></md-checkbox>
        </label>

        <md-outlined-button>Back</md-outlined-button>
        <md-filled-button>Next</md-filled-button>
      </>
  );
}


const TestBoard = ({name}) => {
    // Initialize the board after the component mounts to the DOM
    useEffect(() => {
        setTimeout(() => {

            var config = {
                  position: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R'
            }
            /*global Chessboard */
            var board = Chessboard(name, config);
            console.log("board", board);


            const box_size = 49
        }, 100);
    }, []);

    const arrows = 
        <>
        <Arrow fromX={1} fromY={2} destX={4} destY={4}></Arrow>
        <Arrow fromX={2} fromY={2} destX={4} destY={5} color="green"></Arrow>
        <Arrow fromX={3} fromY={2} destX={4} destY={4}></Arrow>
        <Arrow fromX={4} fromY={2} destX={4} destY={4}></Arrow>
        <Arrow fromX={5} fromY={2} destX={4} destY={4}></Arrow>
        <Arrow fromX={6} fromY={2} destX={4} destY={4}></Arrow>
        </>

    return (
        <>
        <div>
        <Drawings arrows={arrows}> </Drawings>
        <div id={name} style={{ "height": "388px", "width": "388px" }}>
        </div>
        </div>
        </>
        );
}

// cartesian x y to svg
const Arrow = ({fromX, fromY, destX, destY, color = 'red'}) => {

    const targetX1 = fromX - 4.5;
    const targetX2 = destX - 4.5;
    const targetY1 = 4.5 - fromY;
    const targetY2 = 4.5 - destY;

    const markerEnd = color === 'red' ? 'url(#arrowhead-r)' : 'url(#arrowhead-g)';

    return <g><g><line stroke={color} stroke-width="0.15625" stroke-linecap="round" marker-end={markerEnd} opacity="1" x1={targetX1} y1={targetY1} x2={targetX2} y2={targetY2}></line></g></g>

    // return <g><g><line id="test-id" stroke="#15781B" stroke-width="0.15625" stroke-linecap="round" marker-end="url(#arrowhead-g)" opacity="1" d={"M -0.5 2.5 L -0.5 0.65625 z"}></line></g></g>
};

const Circle = ({x, y}) => {
    //return <g><circle stroke="#15781B" stroke-width="0.0625" fill="none" opacity="1" cx="-0.5" cy="2.5" r="0.46875"></circle></g></g>
}
const Drawings = ({arrows, circles}) => {
  return (
    <svg class="cg-shapes" viewBox="-4 -4 8 8" preserveAspectRatio="xMidYMid slice">
      <defs>
          <filter id="cg-filter-blur">
              <feGaussianBlur stdDeviation="0.019"></feGaussianBlur>
          </filter>
          <marker id="arrowhead-g" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05" refY="2" cgKey="g"><path d="M0,0 V4 L3,2 Z" fill="green"></path></marker>
          <marker id="arrowhead-r" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05" refY="2" cgKey="pb"><path d="M0,0 V4 L3,2 Z" fill="red"></path></marker>
      </defs>
    {arrows}
    {circles}
      </svg>

  )
}


export default App;
