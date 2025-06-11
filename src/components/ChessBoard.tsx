import Drawings from "./Drawings";
import { ReactElement, useEffect, useState } from "react";

import { Chess, Move } from "chess.js";
import useWindowSize from "../hooks/useWindowSize";
import { ArrowConfig } from "../types/ArrowConfig";

export interface ChessBoardProps {
  name: string;
  game_url: string;
  invert?: boolean;
  draggable?: boolean;
  madeMoveRef?: any;
  moves?: string[];
  fen: string;
  chessboardRef?: any; // TODO find the correct type
  gameRef?: any;
  dropOffBoard?: string;
  arrows?: ReactElement[];

  size?: string;
  moveCallback?: (move: Move) => void;
}

const ChessBoard = ({
  name,
  game_url,
  invert = false,
  fen = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R",
  arrows = [],
  draggable = false,
  dropOffBoard = "snapback",
  madeMoveRef = { current: true },
  moveCallback = (move: Move) => {
    console.log("Got move", move);
  },
  moves = [],
  chessboardRef = { current: undefined },
  gameRef = { current: undefined },
  size = "512px",
}: ChessBoardProps) => {
  const width = useWindowSize()[0];

  const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, "");

  // Initialize the board after the component mounts to the DOM
  useEffect(() => {
    setTimeout(() => {
      gameRef.current = new Chess();

      function onDragStart(
        _source: string,
        piece: string,
        _position: any,
        _orientation: any,
      ) {
        console.log("onDragStart called, madeMove = ", madeMoveRef);

        if (madeMoveRef.current) {
          console.log("already made move");
          return false;
        }

        // only pick up pieces for the side to move
        if (
          (gameRef.current.turn() === "w" && piece.search(/^b/) !== -1) ||
          (gameRef.current.turn() === "b" && piece.search(/^w/) !== -1)
        ) {
          return false;
        }
      }

      // update the board position after the piece snap
      // for castling, en passant, pawn promotion
      function onSnapEnd() {
        chessboardRef.current?.position(gameRef.current.fen());
      }

      function onDrop(source: any, target: any) {
        console.log("onDrop called");

        const chess = new Chess();
        let move: Move = chess.move("e4");

        try {
          // see if the move is legal
          move = gameRef.current.move({
            from: source,
            to: target,
            // promotion: 'q' // NOTE: always promote to a queen for example simplicity
          });

          moveCallback(move);
        } catch (e) {
          //console.log("Invalid move attempted", e)
          return "snapback";
        }

        moveCallback(move);
      }

      // wow
      const stuff: Record<string, string> = {
        wP : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PHBhdGggZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNMjIuNSA5Yy0yLjIxIDAtNCAxLjc5LTQgNCAwIC44OS4yOSAxLjcxLjc4IDIuMzhDMTcuMzMgMTYuNSAxNiAxOC41OSAxNiAyMWMwIDIuMDMuOTQgMy44NCAyLjQxIDUuMDMtMyAxLjA2LTcuNDEgNS41NS03LjQxIDEzLjQ3aDIzYzAtNy45Mi00LjQxLTEyLjQxLTcuNDEtMTMuNDcgMS40Ny0xLjE5IDIuNDEtMyAyLjQxLTUuMDMgMC0yLjQxLTEuMzMtNC41LTMuMjgtNS42Mi40OS0uNjcuNzgtMS40OS43OC0yLjM4IDAtMi4yMS0xLjc5LTQtNC00eiIvPjwvc3ZnPg==',
        wK : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIGQ9Ik0yMi41IDExLjYzVjZNMjAgOGg1Ii8+PHBhdGggZmlsbD0iI2ZmZiIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIGQ9Ik0yMi41IDI1czQuNS03LjUgMy0xMC41YzAgMC0xLTIuNS0zLTIuNXMtMyAyLjUtMyAyLjVjLTEuNSAzIDMgMTAuNSAzIDEwLjUiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTEuNSAzN2M1LjUgMy41IDE1LjUgMy41IDIxIDB2LTdzOS00LjUgNi0xMC41Yy00LTYuNS0xMy41LTMuNS0xNiA0VjI3di0zLjVjLTMuNS03LjUtMTMtMTAuNS0xNi00LTMgNiA1IDEwIDUgMTBWMzd6Ii8+PHBhdGggZD0iTTExLjUgMzBjNS41LTMgMTUuNS0zIDIxIDBtLTIxIDMuNWM1LjUtMyAxNS41LTMgMjEgMG0tMjEgMy41YzUuNS0zIDE1LjUtMyAyMSAwIi8+PC9nPjwvc3ZnPg==',
        wB : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxnIGZpbGw9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij48cGF0aCBkPSJNOSAzNmMzLjM5LS45NyAxMC4xMS40MyAxMy41LTIgMy4zOSAyLjQzIDEwLjExIDEuMDMgMTMuNSAyIDAgMCAxLjY1LjU0IDMgMi0uNjguOTctMS42NS45OS0zIC41LTMuMzktLjk3LTEwLjExLjQ2LTEzLjUtMS0zLjM5IDEuNDYtMTAuMTEuMDMtMTMuNSAxLTEuMzUuNDktMi4zMi40Ny0zLS41IDEuMzUtMS45NCAzLTIgMy0yeiIvPjxwYXRoIGQ9Ik0xNSAzMmMyLjUgMi41IDEyLjUgMi41IDE1IDAgLjUtMS41IDAtMiAwLTIgMC0yLjUtMi41LTQtMi41LTQgNS41LTEuNSA2LTExLjUtNS0xNS41LTExIDQtMTAuNSAxNC01IDE1LjUgMCAwLTIuNSAxLjUtMi41IDQgMCAwLS41LjUgMCAyeiIvPjxwYXRoIGQ9Ik0yNSA4YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAxIDEgNSAweiIvPjwvZz48cGF0aCBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBkPSJNMTcuNSAyNmgxME0xNSAzMGgxNW0tNy41LTE0LjV2NU0yMCAxOGg1Ii8+PC9nPjwvc3ZnPg==',
        wR : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBkPSJNOSAzOWgyN3YtM0g5djN6bTMtM3YtNGgyMXY0SDEyem0tMS0yMlY5aDR2Mmg1VjloNXYyaDVWOWg0djUiLz48cGF0aCBkPSJtMzQgMTQtMyAzSDE0bC0zLTMiLz48cGF0aCBzdHJva2UtbGluZWNhcD0iYnV0dCIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTMxIDE3djEyLjVIMTRWMTciLz48cGF0aCBkPSJtMzEgMjkuNSAxLjUgMi41aC0yMGwxLjUtMi41Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTExIDE0aDIzIi8+PC9nPjwvc3ZnPg==',
        wQ : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik04IDEyYTIgMiAwIDEgMS00IDAgMiAyIDAgMSAxIDQgMHptMTYuNS00LjVhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAwek00MSAxMmEyIDIgMCAxIDEtNCAwIDIgMiAwIDEgMSA0IDB6TTE2IDguNWEyIDIgMCAxIDEtNCAwIDIgMiAwIDEgMSA0IDB6TTMzIDlhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAweiIvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBkPSJNOSAyNmM4LjUtMS41IDIxLTEuNSAyNyAwbDItMTItNyAxMVYxMWwtNS41IDEzLjUtMy0xNS0zIDE1LTUuNS0xNFYyNUw3IDE0bDIgMTJ6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIGQ9Ik05IDI2YzAgMiAxLjUgMiAyLjUgNCAxIDEuNSAxIDEgLjUgMy41LTEuNSAxLTEuNSAyLjUtMS41IDIuNS0xLjUgMS41LjUgMi41LjUgMi41IDYuNSAxIDE2LjUgMSAyMyAwIDAgMCAxLjUtMSAwLTIuNSAwIDAgLjUtMS41LTEtMi41LS41LTIuNS0uNS0yIC41LTMuNSAxLTIgMi41LTIgMi41LTQtOC41LTEuNS0xOC41LTEuNS0yNyAweiIvPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0xMS41IDMwYzMuNS0xIDE4LjUtMSAyMiAwTTEyIDMzLjVjNi0xIDE1LTEgMjEgMCIvPjwvZz48L3N2Zz4=',
        wN : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yMiAxMGMxMC41IDEgMTYuNSA4IDE2IDI5SDE1YzAtOSAxMC02LjUgOC0yMSIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNCAxOGMuMzggMi45MS01LjU1IDcuMzctOCA5LTMgMi0yLjgyIDQuMzQtNSA0LTEuMDQyLS45NCAxLjQxLTMuMDQgMC0zLTEgMCAuMTkgMS4yMy0xIDItMSAwLTQuMDAzIDEtNC00IDAtMiA2LTEyIDYtMTJzMS44OS0xLjkgMi0zLjVjLS43My0uOTk0LS41LTItLjUtMyAxLTEgMyAyLjUgMyAyLjVoMnMuNzgtMS45OTIgMi41LTNjMSAwIDEgMyAxIDMiLz48cGF0aCBmaWxsPSIjMDAwIiBkPSJNOS41IDI1LjVhLjUuNSAwIDEgMS0xIDAgLjUuNSAwIDEgMSAxIDB6bTUuNDMzLTkuNzVhLjUgMS41IDMwIDEgMS0uODY2LS41LjUgMS41IDMwIDEgMSAuODY2LjV6Ii8+PC9nPjwvc3ZnPg==',
        bP : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PHBhdGggc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNMjIuNSA5YTQgNCAwIDAgMC0zLjIyIDYuMzggNi40OCA2LjQ4IDAgMCAwLS44NyAxMC42NWMtMyAxLjA2LTcuNDEgNS41NS03LjQxIDEzLjQ3aDIzYzAtNy45Mi00LjQxLTEyLjQxLTcuNDEtMTMuNDdhNi40NiA2LjQ2IDAgMCAwLS44Ny0xMC42NUE0LjAxIDQuMDEgMCAwIDAgMjIuNSA5eiIvPjwvc3ZnPg==',
        bK : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIGQ9Ik0yMi41IDExLjZWNiIvPjxwYXRoIGZpbGw9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBkPSJNMjIuNSAyNXM0LjUtNy41IDMtMTAuNWMwIDAtMS0yLjUtMy0yLjVzLTMgMi41LTMgMi41Yy0xLjUgMyAzIDEwLjUgMyAxMC41Ii8+PHBhdGggZmlsbD0iIzAwMCIgZD0iTTExLjUgMzdhMjIuMyAyMi4zIDAgMCAwIDIxIDB2LTdzOS00LjUgNi0xMC41Yy00LTYuNS0xMy41LTMuNS0xNiA0VjI3di0zLjVjLTMuNS03LjUtMTMtMTAuNS0xNi00LTMgNiA1IDEwIDUgMTBWMzd6Ii8+PHBhdGggc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTIwIDhoNSIvPjxwYXRoIHN0cm9rZT0iI2VjZWNlYyIgZD0iTTMyIDI5LjVzOC41LTQgNi05LjdDMzQuMSAxNCAyNSAxOCAyMi41IDI0LjZ2Mi4xLTIuMUMyMCAxOCA5LjkgMTQgNyAxOS45Yy0yLjUgNS42IDQuOCA5IDQuOCA5Ii8+PHBhdGggc3Ryb2tlPSIjZWNlY2VjIiBkPSJNMTEuNSAzMGM1LjUtMyAxNS41LTMgMjEgMG0tMjEgMy41YzUuNS0zIDE1LjUtMyAyMSAwbS0yMSAzLjVjNS41LTMgMTUuNS0zIDIxIDAiLz48L2c+PC9zdmc+',
        bB : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxnIGZpbGw9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij48cGF0aCBkPSJNOSAzNmMzLjQtMSAxMC4xLjQgMTMuNS0yIDMuNCAyLjQgMTAuMSAxIDEzLjUgMiAwIDAgMS42LjUgMyAyLS43IDEtMS42IDEtMyAuNS0zLjQtMS0xMC4xLjUtMTMuNS0xLTMuNCAxLjUtMTAuMSAwLTEzLjUgMS0xLjQuNS0yLjMuNS0zLS41IDEuNC0yIDMtMiAzLTJ6Ii8+PHBhdGggZD0iTTE1IDMyYzIuNSAyLjUgMTIuNSAyLjUgMTUgMCAuNS0xLjUgMC0yIDAtMiAwLTIuNS0yLjUtNC0yLjUtNCA1LjUtMS41IDYtMTEuNS01LTE1LjUtMTEgNC0xMC41IDE0LTUgMTUuNSAwIDAtMi41IDEuNS0yLjUgNCAwIDAtLjUuNSAwIDJ6Ii8+PHBhdGggZD0iTTI1IDhhMi41IDIuNSAwIDEgMS01IDAgMi41IDIuNSAwIDEgMSA1IDB6Ii8+PC9nPjxwYXRoIHN0cm9rZT0iI2VjZWNlYyIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTE3LjUgMjZoMTBNMTUgMzBoMTVtLTcuNS0xNC41djVNMjAgMThoNSIvPjwvZz48L3N2Zz4=',
        bR : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBkPSJNOSAzOWgyN3YtM0g5djN6bTMuNS03IDEuNS0yLjVoMTdsMS41IDIuNWgtMjB6bS0uNSA0di00aDIxdjRIMTJ6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIGQ9Ik0xNCAyOS41di0xM2gxN3YxM0gxNHoiLz48cGF0aCBzdHJva2UtbGluZWNhcD0iYnV0dCIgZD0iTTE0IDE2LjUgMTEgMTRoMjNsLTMgMi41SDE0ek0xMSAxNFY5aDR2Mmg1VjloNXYyaDVWOWg0djVIMTF6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWNlY2VjIiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBzdHJva2Utd2lkdGg9IjEiIGQ9Ik0xMiAzNS41aDIxbS0yMC00aDE5bS0xOC0yaDE3bS0xNy0xM2gxN00xMSAxNGgyMyIvPjwvZz48L3N2Zz4=',
        bQ : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxnIHN0cm9rZT0ibm9uZSI+PGNpcmNsZSBjeD0iNiIgY3k9IjEyIiByPSIyLjc1Ii8+PGNpcmNsZSBjeD0iMTQiIGN5PSI5IiByPSIyLjc1Ii8+PGNpcmNsZSBjeD0iMjIuNSIgY3k9IjgiIHI9IjIuNzUiLz48Y2lyY2xlIGN4PSIzMSIgY3k9IjkiIHI9IjIuNzUiLz48Y2lyY2xlIGN4PSIzOSIgY3k9IjEyIiByPSIyLjc1Ii8+PC9nPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBkPSJNOSAyNmM4LjUtMS41IDIxLTEuNSAyNyAwbDIuNS0xMi41TDMxIDI1bC0uMy0xNC4xLTUuMiAxMy42LTMtMTQuNS0zIDE0LjUtNS4yLTEzLjZMMTQgMjUgNi41IDEzLjUgOSAyNnoiLz48cGF0aCBzdHJva2UtbGluZWNhcD0iYnV0dCIgZD0iTTkgMjZjMCAyIDEuNSAyIDIuNSA0IDEgMS41IDEgMSAuNSAzLjUtMS41IDEtMS41IDIuNS0xLjUgMi41LTEuNSAxLjUuNSAyLjUuNSAyLjUgNi41IDEgMTYuNSAxIDIzIDAgMCAwIDEuNS0xIDAtMi41IDAgMCAuNS0xLjUtMS0yLjUtLjUtMi41LS41LTIgLjUtMy41IDEtMiAyLjUtMiAyLjUtNC04LjUtMS41LTE4LjUtMS41LTI3IDB6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIGQ9Ik0xMSAzOC41YTM1IDM1IDEgMCAwIDIzIDAiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNlY2VjZWMiIGQ9Ik0xMSAyOWEzNSAzNSAxIDAgMSAyMyAwbS0yMS41IDIuNWgyMG0tMjEgM2EzNSAzNSAxIDAgMCAyMiAwbS0yMyAzYTM1IDM1IDEgMCAwIDI0IDAiLz48L2c+PC9zdmc+',
        bN : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NSA0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMiAxMGMxMC41IDEgMTYuNSA4IDE2IDI5SDE1YzAtOSAxMC02LjUgOC0yMSIvPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yNCAxOGMuMzggMi45MS01LjU1IDcuMzctOCA5LTMgMi0yLjgyIDQuMzQtNSA0LTEuMDQtLjk0IDEuNDEtMy4wNCAwLTMtMSAwIC4xOSAxLjIzLTEgMi0xIDAtNCAxLTQtNCAwLTIgNi0xMiA2LTEyczEuODktMS45IDItMy41Yy0uNzMtMS0uNS0yLS41LTMgMS0xIDMgMi41IDMgMi41aDJzLjc4LTIgMi41LTNjMSAwIDEgMyAxIDMiLz48cGF0aCBmaWxsPSIjZWNlY2VjIiBzdHJva2U9IiNlY2VjZWMiIGQ9Ik05LjUgMjUuNWEuNS41IDAgMSAxLTEgMCAuNS41IDAgMSAxIDEgMHptNS40My05Ljc1YS41IDEuNSAzMCAxIDEtLjg2LS41LjUgMS41IDMwIDEgMSAuODYuNXoiLz48cGF0aCBmaWxsPSIjZWNlY2VjIiBzdHJva2U9Im5vbmUiIGQ9Im0yNC41NSAxMC40LS40NSAxLjQ1LjUuMTVjMy4xNSAxIDUuNjUgMi40OSA3LjkgNi43NVMzNS43NSAyOS4wNiAzNS4yNSAzOWwtLjA1LjVoMi4yNWwuMDUtLjVjLjUtMTAuMDYtLjg4LTE2Ljg1LTMuMjUtMjEuMzQtMi4zNy00LjQ5LTUuNzktNi42NC05LjE5LTcuMTZsLS41MS0uMXoiLz48L2c+PC9zdmc+'
      }

      function pieceTheme(piece: string): string {

        return stuff[piece];
      }

      const config = {
        pieceTheme,
        position: fen,
        draggable: draggable,
        dropOffBoard,
        onDragStart,
        onDrop,
        onSnapEnd,
      };

      try {
        // TODO fork and react-ify this library

        const domElement = document.getElementById(finalID);

        if (!domElement) {
          console.log(
            "DOM element was not present. App will not call Chessboard to avoid an alert() call.",
          );
          return;
        }
        /*global Chessboard */
        // @ts-expect-error It's OK until we get a react chess board
        chessboardRef.current = Chessboard(finalID, config);
      } catch (e) {
        // This fires sometimes when it does not affect the experience
        console.log("Got exception", e);
      }

      function makeMoves(moves: string[]) {
        if (moves.length) {
          setTimeout(() => {
            // console.log("Moving", moves);

            // console.log("Trying singleMove", singleMove);

            let singleMove;
            try {
              singleMove = gameRef.current.move(moves[0]);

              // board.move(`${singleMove.from}-${singleMove.to}`);
              chessboardRef?.current?.position(gameRef.current.fen());
            } catch (e) {
              // This "shouldn't" ever happen
              // In the real world this is a good place to log for debugging
              console.debug(
                "Unable to make move",
                singleMove,
                " on board",
                gameRef.current,
                e,
              );
            }
            makeMoves(moves.slice(1));
          }, 250);
        }
      }

      if (!chessboardRef?.current) {
        return;
      }

      setTimeout(() => {
        makeMoves(moves);
      }, 200);

      if (invert) {
        chessboardRef?.current?.flip();
      }

      // Turn off mobile scrolling behavior if they drag inside the board on mobile
      const domBoard = document.getElementById(finalID);

      if (draggable) {
        function preventBehavior(e: any) {
          e.preventDefault();
        }

        domBoard?.addEventListener("touchmove", preventBehavior, {
          passive: false,
        });
      }
    }, 100);

    // If you take out the dependency array, it remakes the board each time
    // eslint-disable-next-line
  }, [fen, finalID, invert]);

  // Resize when the window changes width
  useEffect(
    () => {
      if (chessboardRef.current) {
        chessboardRef.current.resize();
      }
    },
    // We don't care about the dependency on board; it won't be re-set with the current code
    // eslint-disable-next-line
    [width],
  );

    // Resize when the window changes width
    useEffect(
      () => {
        if (chessboardRef.current) {
          chessboardRef.current.resize();
        }
      },
      // We don't care about the dependency on board; it won't be re-set with the current code
      // eslint-disable-next-line
      [size],
    );

  let drawings = <Drawings arrows={arrows}> </Drawings>;

  // let widthOfChessboard = width - 36;
  let widthOfChessboard = Math.min(width - 36, 513);

  let style = {
    height: size,
    width: size,
  };

  return (
    <div className="side-by-side">
      {drawings}
      <div id={finalID} style={style}></div>
    </div>
  );
};

export default ChessBoard;
