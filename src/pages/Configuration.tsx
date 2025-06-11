import { clearAllGames, setItemDexie } from "../storage";
import FileUpload from "../components/FileUpload";
import AnalysisDatabase from "../types/AnalysisDatabase";
import Repertoire from "../types/Repertoire";
import Game from "../types/Game";

import { InputText}  from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';

import { Button } from 'primereact/button';

interface ConfigPageProps {
  playerName: string;
  setPlayerName: (newValue: string) => void;
  lichessPlayerName: string;
  setLichessPlayerName: (newValue: string) => void;
  repertoireChoice: string;
  setRepertoireChoice: (newValue: string) => void;
  newRepertoireNameField: string;
  setNewRepertoireNameField: (newValue: string) => void;
  setRepertoire: (newValue: { [name: string]: Repertoire }) => void;
  repertoire: { [name: string]: Repertoire };
  repertoireList: string[];
  setRepertoireList: (newValue: string[]) => void;
  dispatchAnalysisDatabase: any;
  setGames: (newValue: Game[]) => void;
  games: Game[];
  analysisDatabase: AnalysisDatabase;
}

function ConfigPage({
  playerName,
  setPlayerName,
  lichessPlayerName,
  setLichessPlayerName,
  repertoireChoice,
  setRepertoireChoice,
  newRepertoireNameField,
  setNewRepertoireNameField,
  setRepertoire,
  repertoire,
  repertoireList,
  setRepertoireList,
  dispatchAnalysisDatabase,
  setGames,
  games,
  analysisDatabase,
}: ConfigPageProps) {
  // Make the checkbox items for repertoire selection
  const checkboxItems = (repertoireList ? repertoireList : []).map(
    (repertoireName) => {
      const props =
        repertoireName === repertoireChoice
          ? {
              checked: true,
              "touch-target": "wrapper",
            }
          : {
              "touch-target": "wrapper",
            };

      return (
        <div className="radio-label" key={repertoireName}>
          <RadioButton
            data-testid={"repertoireChoiceField" + repertoireName}
            aria-label={repertoireName}
            onChange={() => {
              setRepertoireChoice(repertoireName);
              setItemDexie("repertoireChoice", repertoireName);
            }}
            id="default-lines-radio"
            name="with-labels"
            {...props}
          ></RadioButton>
          <label htmlFor="default-lines-radio">{repertoireName}</label>
        </div>
      );
    },
  );

  let resetGamesButton = (
    <div key={"reset-games-button"}>
      <p> Current Games: {games.length}</p>
      <Button
        data-testid={"reset-games-button"}
        className={"drill-button"}
        onClick={() => {
          setGames([]);
          setItemDexie("games", []);
          clearAllGames();
        }}
      >
        Reset Games
      </Button>
    </div>
  );

  let resetAnalysisDatabase = (
    <div key={"reset-analysis-button"}>
      <p>
        {" "}
        Current Analysis Items:{" "}
        {typeof analysisDatabase === "object"
          ? Object.keys(analysisDatabase).length
          : "Not initialized"}
      </p>
      <Button
        data-testid={"reset-analysis-db-button"}
        className={"drill-button"}
        onClick={() => {
          dispatchAnalysisDatabase({ type: "RESET" });
          setItemDexie("analysisDatabase", {});
        }}
      >
        Reset Analysis Database
      </Button>
    </div>
  );

  let resetRepertoires = (
    <div key={"reset-repertoires-button"}>
      <p> Current Repertoires: {repertoireList.length}</p>
      <Button
        data-testid={"reset-repertoires-button"}
        className={"drill-button"}
        onClick={() => {
          setRepertoireChoice("");
          setItemDexie("repertoireChoice", "");

          setRepertoireList([]);
          setItemDexie("repertoireList", []);

          setRepertoire({});
          setItemDexie("repertoire", {});
        }}
      >
        Reset Repertoires
      </Button>
    </div>
  );

  let buttons = [resetGamesButton, resetAnalysisDatabase, resetRepertoires];

  return (
    <>
      <h2>Configuration</h2>

      <h3>User</h3>
      <p>Please enter your chess.com username</p>
      <InputText
        data-testid={"chess-dot-com-username"}
        placeholder="chess.com Username"
        value={playerName}
        onChange={(e: { target: { value: string } }) => {
          // console.log(e);
          setPlayerName(e.target.value);
          setItemDexie("playerName", e.target.value);
        }}
      ></InputText>

      <p>Please enter your lichess.org username</p>
      <InputText
        data-testid={"lichess-dot-org-username"}
        placeholder="lichess.org Username"
        value={lichessPlayerName}
        onChange={(e: { target: { value: string } }) => {
          // console.log(e);
          setLichessPlayerName(e.target.value);
          setItemDexie("lichessPlayerName", e.target.value);
        }}
      ></InputText>

      <h3>Repertoire</h3>
      <div className="column" role="radiogroup" aria-label="Repertoire">
        {checkboxItems}
      </div>

      <h3>Upload New Lines</h3>

      <InputText
        data-testid={"new-repertoire-name-field"}
        placeholder="Repertoire Name"
        value={newRepertoireNameField}
        onChange={(e: { target: { value: string } }) => {
          setNewRepertoireNameField(e.target.value);
          // console.log("set it to ", e.target.value);
        }}
      ></InputText>
      <br></br>
      <FileUpload
        newRepertoireNameField={newRepertoireNameField}
        {...{
          repertoire,
          setRepertoire,
          setNewRepertoireNameField,
          repertoireList,
          setRepertoireList,
        }}
      >
        {" "}
      </FileUpload>

      <h3>Clear Data</h3>
      {buttons}
      {<Button onClick={
        () => {
          caches.keys().then(function(names) {
            for (let name of names)
                caches.delete(name);
        });
        
        }
      } label="Clear service worker cache" />}
    </>
  );
}

export default ConfigPage;
