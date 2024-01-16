import {setItemDexie} from "../storage";
import FileUpload from "../components/FileUpload";


function ConfigPage({
                        playerName, setPlayerName, repertoireChoice, setRepertoireChoice, newRepertoireNameField, setNewRepertoireNameField,
                        setRepertoire, repertoire, repertoireList, setRepertoireList, matchingMoves, setMatchingMoves, setCurrentGames, dispatchAnalysisDatabase, setGames}) {

    // Make the checkbox items for repertoire selection
    const checkboxItems =
        (repertoireList && repertoireList.map && repertoireList || []).map(repertoireName => {
            const kebabed = repertoireName;

            const props = repertoireName === repertoireChoice ? ({
                "checked": true,
                "touch-target": "wrapper"
            }) : {
                "touch-target": "wrapper"
            };

            return <div class="radio-label">
                <md-radio
                    aria-label={repertoireName}
                    onClick={() => {

                        setRepertoireChoice(repertoireName);
                        setItemDexie("repertoireChoice", repertoireName);
                    }}
                    id="default-lines-radio"
                    name="with-labels"
                    {...props}>
                </md-radio>
                <label for="default-lines-radio">{repertoireName}</label>
            </div>
        })

    let resetGamesButton = <md-filled-button className={"drill-button"} onClick={() => {
        setGames([]);
        setItemDexie("games", []);
    }}>Reset Games</md-filled-button>;

    let resetAnalysisDatabase = <md-filled-button className={"drill-button"} onClick={() => {

        dispatchAnalysisDatabase({type: 'RESET'});
        setItemDexie("analysisDatabase", {});

    }}>Reset Analysis Database</md-filled-button>

    let resetRepertoires = <md-filled-button className={"drill-button"} onClick={() => {

        setRepertoireChoice({});
        setItemDexie("repertoireChoice", "");

        setRepertoireList({});
        setItemDexie("repertoireList", []);

        setRepertoire({});
        setItemDexie("repertoire", {});


    }}>Reset Repertoires</md-filled-button>

    let buttons = [resetGamesButton, resetAnalysisDatabase, resetRepertoires ];

    return <>
        <h2>Configuration</h2>

        <h3>User</h3>
        <p>Please enter your chess.com username.</p>


        <md-outlined-text-field
            label="chess.com Username"
            value={playerName}
            onInput={e => {
                setPlayerName(e.target.value);
                setItemDexie("playerName", e.target.value);
            }}>
        </md-outlined-text-field>

        <h3>Repertoire</h3>
        <div class="column" role="radiogroup" aria-label="Repertoire">
            {checkboxItems}
        </div>

        <h3>Upload New Lines</h3>

        <md-outlined-text-field
            label="Repertoire Name"
            value={newRepertoireNameField}

            onInput={e => {
                setNewRepertoireNameField(e.target.value);
                console.log("set it to ", e.target.value);

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

        <h3>Settings</h3>

        <br></br>

        <label>
            Show lines that have at least this many matching moves
        </label>
        <md-outlined-text-field
            label="Matching Moves"
            value={matchingMoves}
            type="number"
            onInput={e => {
                setMatchingMoves(e.target.value);
                setItemDexie("matchingMoves", e.target.value);
            }}>
        </md-outlined-text-field>

        <br></br>

        {buttons}
    </>
}

export default ConfigPage;