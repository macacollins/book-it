import {ArrowConfig} from './ArrowConfig';

export default interface AnalysisResult { 
    invert_board: boolean,
    arrows : ArrowConfig[],
    result : string,
    finalMoveIndex : number,

    youLeftBook: boolean,
    foundIntersection: boolean,
    advice : string,
    displayFEN : string,
    headers: any,
    openingFamily: string
}
