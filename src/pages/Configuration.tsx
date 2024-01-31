import {setItemDexie} from "../storage";
import FileUpload from "../components/FileUpload";
import AnalysisDatabase from '../types/AnalysisDatabase';
import Repertoire from '../types/Repertoire';
import Game from '../types/Game';

interface ConfigPageProps {
    playerName: string,
    setPlayerName: (newValue: string) => void,
    repertoireChoice: string,
    setRepertoireChoice: (newValue: string) => void,
    newRepertoireNameField: string,
    setNewRepertoireNameField: (newValue: string) => void,
    setRepertoire: (newValue: { [name: string]: Repertoire }) => void,
    repertoire: { [name: string]: Repertoire },
    repertoireList: string[]
    setRepertoireList: (newValue: string[]) => void,
    dispatchAnalysisDatabase: any,
    setGames: (newValue: Game[]) => void,
    games: Game[],
    analysisDatabase: AnalysisDatabase
}

function ConfigPage({
                        playerName,
                        setPlayerName,
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
                        analysisDatabase
                    }: ConfigPageProps) {

    // Make the checkbox items for repertoire selection
    const checkboxItems =
        (repertoireList ? repertoireList : []).map(repertoireName => {
            const props = repertoireName === repertoireChoice ? ({
                "checked": true,
                "touch-target": "wrapper"
            }) : {
                "touch-target": "wrapper"
            };

            return <div className="radio-label" key={repertoireName}>
                <md-radio
                    data-testid={"repertoireChoiceField" + repertoireName}
                    aria-label={repertoireName}
                    onClick={() => {

                        setRepertoireChoice(repertoireName);
                        setItemDexie("repertoireChoice", repertoireName);
                    }}
                    id="default-lines-radio"
                    name="with-labels"
                    {...props}>
                </md-radio>
                <label htmlFor="default-lines-radio">{repertoireName}</label>
            </div>
        })

    let resetGamesButton = <div key={"reset-games-button"}>
        <p> Current Games: {games.length}</p>
        <md-filled-button data-testid={"reset-games-button"} className={"drill-button"} onClick={() => {
            setGames([]);
            setItemDexie("games", []);
        }}>Reset Games
        </md-filled-button>
    </div>;

    let resetAnalysisDatabase = <div key={"reset-analysis-button"}>
        <p> Current Analysis Items: {typeof analysisDatabase === 'object' ? Object.keys(analysisDatabase).length : "Not initialized"}</p>
        <md-filled-button data-testid={"reset-analysis-db-button"} className={"drill-button"} onClick={() => {

            dispatchAnalysisDatabase({type: 'RESET'});
            setItemDexie("analysisDatabase", {});

        }}>Reset Analysis Database
        </md-filled-button>
    </div>

    let resetRepertoires =
        <div key={"reset-repertoires-button"}>
            <p> Current Repertoires: {repertoireList.length}</p>
            <md-filled-button data-testid={"reset-repertoires-button"} className={"drill-button"} onClick={() => {

                setRepertoireChoice("");
                setItemDexie("repertoireChoice", "");

                setRepertoireList([]);
                setItemDexie("repertoireList", []);

                setRepertoire({});
                setItemDexie("repertoire", {});


            }}>Reset Repertoires
            </md-filled-button>
        </div>

    let buttons = [resetGamesButton, resetAnalysisDatabase, resetRepertoires];

    return <>
        <h2>Configuration</h2>

        <h3>User</h3>
        <p>Please enter your chess.com username</p>


        <md-outlined-text-field
            data-testid={"chess-dot-com-username"}
            label="chess.com Username"
            value={playerName}
            onInput={(e: { target: { value: string }}) => {
                // console.log(e);
                setPlayerName(e.target.value);
                setItemDexie("playerName", e.target.value);
            }}>
        </md-outlined-text-field>

        <h3>Repertoire</h3>
        <div className="column" role="radiogroup" aria-label="Repertoire">
            {checkboxItems}
        </div>

        <h3>Upload New Lines</h3>

        <md-outlined-text-field
            data-testid={"new-repertoire-name-field"}
            label="Repertoire Name"
            value={newRepertoireNameField}

            onInput={(e: { target: { value: string }}) => {
                setNewRepertoireNameField(e.target.value);
                // console.log("set it to ", e.target.value);
            }}>
        </md-outlined-text-field>
        <br></br>
        <FileUpload
            newRepertoireNameField={newRepertoireNameField}
            {...{
                repertoire,
                setRepertoire,
                setNewRepertoireNameField,
                repertoireList,
                setRepertoireList
            }}> </FileUpload>

        <h3>Clear Data</h3>
        {buttons}
    </>
}

export default ConfigPage;
