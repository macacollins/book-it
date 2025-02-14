import { useState, useEffect } from "react";

import { ProgressSpinner } from "primereact/progressspinner";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ChessBoard from "./ChessBoard";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog} from 'primereact/dialog';

import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext'; 
import JSZip from "jszip";
// @ts-ignore
import FileSaver from "file-saver";
import { Checkbox } from "primereact/checkbox";
import { FilterMatchMode } from "primereact/api";

interface NotesItem {
  key: number;
  fen: string;
  move: string;
  notes: string;
  repertoire: string;
  original_location: string;
}

export default function Notes() {
  const [loading, setLoading] = useState(true);
  const [shouldInvert, setShouldInvert] = useState(true);
  const [results, setResults] = useState<NotesItem[]>([]);
  const [editingID, setEditingID] = useState<number | undefined>();

  const [filters, setFilters] = useState({
    repertoire: { value: null, matchMode: FilterMatchMode.IN }
  });

  const [selectedRepertoire, setSelectedRepertoire] = useState<any>(null);

  const [shouldRefresh, setShouldRefresh] = useState<boolean>(true);

  const updateNote = (noteData: NotesItem) => {
    setResults(results.map(result => {
      if (result.key === noteData.key) {
        return noteData;
      }
      return result;
    }));
  }

  const currentItem: NotesItem | undefined = results.find(a => a.key === editingID);

  // Load stuff
  useEffect(() => {
    if (loading || shouldRefresh) {
      fetch("http://localhost:3001/notes")
        .then((response) => response.json())
        .then((json) => {
          setLoading(false);
          setResults(json);
          setShouldRefresh(false);
        });
    }
  }, [shouldRefresh]);

  if (loading) {
    return (
      <div className="w-100vh flex-column font-bold text-3xl row-gap-4 font-size-lg p-7 min-h-full flex align-items-center justify-content-center">
        <ProgressSpinner />
        Loading
      </div>
    );
  }

  const options = [
    ...new Set(results.map((result: any) => result.repertoire)),
  ].map((code) => ({ code }));

  function generateCardConfig(
    selectedRepertoire: string,
    results: NotesItem[],
  ): string {
    const filtered = results.filter(
      (result) => result.repertoire === selectedRepertoire,
    );
    console.log("Making csv for", filtered.length, "results");

    return filtered
      .map((note) => {
        const rawNotes = note.notes.replaceAll("\n", "<br>");

        return `Move and Reason<br><img src="${shortenLine(note.fen)}.svg"/><br>The move is {{c1::${note.move}}} because {{c1::${rawNotes}}}`;
      })
      .join("\n");
  }

  return (
    <>
      <h2>Notes</h2>
      <section id="form" className="flex gap-3 row-gap-3 p-3">
        <Dropdown
          className="w-4 max-h-3rem m-3"
          placeholder="Select Repertoire"
          optionLabel="code"
          value={selectedRepertoire}
          onChange={(e) => setSelectedRepertoire(e.value)}
          options={options}
        ></Dropdown>
        <label className={"p-3 gap-1 flex flex-column font-bold"}>
          Invert
          <Checkbox
            checked={shouldInvert}
            onClick={(e: any) => {
              console.log(e);
              setShouldInvert(!shouldInvert);
            }}
          />
        </label>
        <Button
          className=" max-h-3rem m-3"
          disabled={!selectedRepertoire}
          label="Export"
          onClick={() => {
            const zip = new JSZip();

            const folderName = selectedRepertoire.code || "export";

            const mediaName = folderName + "/media";
            const getMediaPath = (fen: string) =>
              `${mediaName}/${shortenLine(fen)}.svg`;

            zip.folder(folderName);
            zip.file(
              folderName + "/" + "cards.csv",
              generateCardConfig(folderName, results),
            );
            zip.folder(mediaName);

            const filtered = results.filter(
              (result) => result.repertoire === selectedRepertoire.code,
            );
            filtered.forEach(({ fen }) => {
              zip.file(
                getMediaPath(fen),
                createSVGboard(fen, [], shouldInvert),
              );
            });

            zip.generateAsync({ type: "blob" }).then(function (content) {
              FileSaver.saveAs(content, selectedRepertoire?.code + ".zip");
            });
          }}
        />
      </section>
      <DataTable filters={filters} paginator paginatorPosition="both" rows={5} rowsPerPageOptions={[5, 10, 25, 50]} value={results}>
        <Column
          header="FEN"
          field="fen"
          body={(a) => <TinyFENDisplay keyID={a} fen={a.fen} />}
        />
        <Column header="Notes" field="notes" />
        <Column header="Move" field="move" />
        <Column header="Repertoire" field="repertoire" filterMatchMode="" filter filterField="repertoire"/>
        <Column
          header="Link"
          field="original_location"
          body={(a) => (
            <a target="_blank" href={a.original_location}>
              Link
            </a>
          )}
        />
        <Column
          header="Delete"
          field="key"
          body={(a) => (
            <Button
              label="Delete"
              onClick={() => {
                fetch("http://localhost:3001/notes?key=" + a.key, {
                  method: "DELETE",
                  headers: {
                    Accept: "*",
                  },
                }).then((response) => {
                  //do something awesome that makes the world a better place
                  console.log("Got", response);
                  setShouldRefresh(true);
                });
              }}
            />
          )}
        />
        <Column
          header="Edit"
          field="key"
          body={(a) => (
            <Button
              label="Edit"
              onClick={() => {
                setEditingID(a.key);
              }}
            />
          )}
        />
      </DataTable>
      <Dialog header={`Editing ${editingID}`} visible={!!editingID} style={{ width: '50vw' }} onHide={() => {if (!editingID) return; setEditingID(undefined); }}>
        <div className="flex flex-column gap-2">{currentItem && <TinyFENDisplay fen={currentItem.fen} keyID={currentItem.key}/>}
        <label>Notes</label>
        <InputTextarea 
          className="w-full"
          rows={5}
          value={currentItem?.notes} 
          onChange={(e) => { 
            if (currentItem) {
              updateNote({ ...currentItem, notes: e.target.value });
            }
          }} 
        />
        <label>Move</label>
        <InputText 
          className="w-full"
          value={currentItem?.move} 
          onChange={(e) => { 
            if (currentItem) {
              updateNote({ ...currentItem, move: e.target.value });
            }
          }} 
        />
        <label>Repertoire</label>
        <Dropdown
          value={currentItem?.repertoire}
          options={options}
          className="w-full"
          onChange={(e) => { 
            if (currentItem) {
              updateNote({ ...currentItem, repertoire: e.value });
            }
          }} 
          optionLabel="code"
          optionValue="code"
        />
        
        <Button label="Save Changes" onClick={() => {
          alert('sup');

          const results = fetch("http://localhost:3001/notes", {
            method: "POST",
            headers: {
              'Accept': '*',
              'Content-Type': 'application/json'
            },

            //make sure to serialize your JSON body
            body: JSON.stringify(currentItem)
          })
          .then( (response) => {
            //do something awesome that makes the world a better place
            console.log("Got", response);
          });
        }}/>
        </div>
      </Dialog>
    </>
  );
}

function TinyFENDisplay({
  keyID,
  fen,
  invert = false,
}: {
  keyID: any;
  fen: string;
  invert?: boolean;
}) {
  const madeMoveRef = { current: true };

  const sanitized = fen.replace(/[^a-zA-Z0-9]/gi, "");

  return (
    <div className="">
      <ChessBoard
        fen={fen}
        moves={[]}
        invert={invert}
        madeMoveRef={madeMoveRef}
        name={sanitized + keyID?.key}
        game_url={sanitized + keyID?.key}
        draggable={true}
        size="168px"
      ></ChessBoard>
    </div>
  );
}

function squareToCoordinates(inputString: string): [number, number] {
  // Extract letter and number
  const letter = inputString.charAt(0);
  const number = parseInt(inputString.charAt(1));

  // Calculate the index of the letter (a=1, b=2, ..., h=8)
  const letterIndex = letter.charCodeAt(0) - "a".charCodeAt(0) + 1;

  // Return a list with the calculated values
  return [letterIndex, number];
}

function invert(input: number): number {
  return 7 - input;
}

function shortenLine(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "");
}

function createSVGboard(
  fen: string,
  highlightedSquares: string[],
  shouldInvert: boolean,
) {
  fen = fen.replace(/%20/g, " ");
  let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"  viewBox="-9 -9 378 378">
  <defs>
    <pattern id="bg" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
      <rect fill="rgb(221,227,231)" x="0" y="0" width="90" height="90"/>
      <rect fill="rgb(144,161,172)" x="45" y="0" width="45" height="45"/>
      <rect fill="rgb(144,161,172)" x="0" y="45" width="45" height="45"/>
    </pattern>

    ${/* Pieces */ ""}
    <pattern id="P" width="45" height="45">
        <path fill="#fff" stroke="#000" stroke-linecap="round" stroke-width="1.5" d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>
    </pattern>

    <pattern id="N" width="45" height="45">
        <g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path fill="#fff" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#fff" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/><path fill="#000" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z"/></g>
    </pattern>

    <pattern id="B" width="45" height="45">
        <g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g>
    </pattern>

    <pattern id="R" width="45" height="45">
        <g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5"/><path d="m34 14-3 3H14l-3-3"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M31 17v12.5H14V17"/><path d="m31 29.5 1.5 2.5h-20l1.5-2.5"/><path fill="none" stroke-linejoin="miter" d="M11 14h23"/></g>
    </pattern>

    <pattern id="Q" width="45" height="45">
        <g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0"/></g>
    </pattern>

    <pattern id="K" width="45" height="45">
        <g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/><path fill="#fff" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#fff" d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g>
    </pattern>


    <pattern id="p" width="45" height="45">
    <path stroke="#000" stroke-linecap="round" stroke-width="1.5" d="M22.5 9a4 4 0 0 0-3.22 6.38 6.48 6.48 0 0 0-.87 10.65c-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47a6.46 6.46 0 0 0-.87-10.65A4.01 4.01 0 0 0 22.5 9z"/>
        </pattern>

    <pattern id="n" width="45" height="45">
    <g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path fill="#000" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#000" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-2 2.5-3c1 0 1 3 1 3"/><path fill="#ececec" stroke="#ececec" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.43-9.75a.5 1.5 30 1 1-.86-.5.5 1.5 30 1 1 .86.5z"/><path fill="#ececec" stroke="none" d="m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z"/></g>    </pattern>

    <pattern id="b" width="45" height="45">
    <g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g fill="#000" stroke-linecap="butt"><path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-2 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke="#ececec" stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g>    </pattern>

    <pattern id="r" width="45" height="45">
    <g fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9v3zm3.5-7 1.5-2.5h17l1.5 2.5h-20zm-.5 4v-4h21v4H12z"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M14 29.5v-13h17v13H14z"/><path stroke-linecap="butt" d="M14 16.5 11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z"/><path fill="none" stroke="#ececec" stroke-linejoin="miter" stroke-width="1" d="M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23"/></g>    </pattern>

    <pattern id="q" width="45" height="45">
    <g fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g stroke="none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" stroke-linecap="butt" d="M11 38.5a35 35 1 0 0 23 0"/><path fill="none" stroke="#ececec" d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0"/></g>    </pattern>

    <pattern id="k" width="45" height="45">
    <g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.6V6"/><path fill="#000" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#000" d="M11.5 37a22.3 22.3 0 0 0 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z"/><path stroke-linejoin="miter" d="M20 8h5"/><path stroke="#ececec" d="M32 29.5s8.5-4 6-9.7C34.1 14 25 18 22.5 24.6v2.1-2.1C20 18 9.9 14 7 19.9c-2.5 5.6 4.8 9 4.8 9"/><path stroke="#ececec" d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g>    </pattern>
  </defs>
  <rect x="0" y="0" width="360" height="360" fill="url(#bg)"></rect>`;

  // Add highlights
  if (highlightedSquares) {
    highlightedSquares.forEach((square: string) => {
      const coordinates = squareToCoordinates(square);

      const x = shouldInvert
        ? (8 - coordinates[0]) * 45
        : (coordinates[0] - 1) * 45;
      const y = shouldInvert
        ? (coordinates[1] - 1) * 45
        : (8 - coordinates[1]) * 45;

      console.log("squareToCoordinates", square, coordinates, x, y);

      svg +=
        `<rect fill="rgba(76, 167, 79, 0.3)" x="` +
        x +
        `" y="` +
        y +
        `" width="45" height="45"/>`;
    });
  }

  // Add actual pieces
  let row = 0;
  let col = 0;
  for (var i = 0; i < fen.length; i++) {
    if (row > 7) {
      break;
    }

    const displayRow = shouldInvert ? invert(row) : row;
    const displayCol = shouldInvert ? invert(col) : col;

    switch (fen[i]) {
      case "r":
      case "n":
      case "b":
      case "q":
      case "k":
      case "p": {
        svg += `<rect className="b" x="${displayCol * 45}" y="${displayRow * 45}" width="45" height="45" fill="url(#${fen[i]})"></rect>`;
        col++;
        if (col > 7) {
          col = 0;
          row++;
        }
        break;
      }
      case "R":
      case "N":
      case "B":
      case "Q":
      case "K":
      case "P": {
        svg += `<rect x="${displayCol * 45}" y="${displayRow * 45}" width="45" height="45" fill="url(#${fen[i]})"></rect>`;

        col++;
        if (col > 7) {
          col = 0;
          row++;
        }
        break;
      }
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8": {
        col += parseInt(fen[i]);
        if (col > 7) {
          col = 0;
          row++;
        }
        break;
      }
    }
  }

  svg += "</svg>";
  return svg;
}
