import { ParsedPGN } from "pgn-parser";

export interface TimedMove {
    timeString: string;
    numberSeconds: number;
    move: string;
    player: 'white' | 'black';
    whiteClockSeconds: number;
    blackClockSeconds: number;
}

export interface TVPlan {
    moves: TimedMove[];
    originalPGN: ParsedPGN;
    totalDuration: number;
    startTime: number;

    timeControlBase: number, 
    timeControlIncrement: number
}