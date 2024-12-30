import "./App.css";

import {
  useState,
  useEffect,
  useReducer,
  Dispatch,
  SetStateAction,
} from "react";

import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useNavigate } from 'react-router';
import { setItemDexie } from "./storage";

import defaultGames from "./integrations/default-games";

import analysisDatabaseReducer from "./reducers/analysisDatabase";
import analyzeGames, {
  AnalyzeGamesExpectedMessage,
  InnerAnalyzeGamesExpectedMessage,
} from "./analysis/analyzeGames";

import "./css/colors.module.css";
import "./css/theme.css";
import "./css/theme.dark.css";
import "./css/theme.light.css";
import "./css/tokens.css";
import "./css/typography.module.css";
import "./intrinsics";

import 'primereact/resources/themes/mira/theme.css';


// index.js
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/button/elevated-button.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/radio/radio.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/tabs/primary-tab.js";
import "@material/web/tabs/secondary-tab.js";
import "@material/web/tabs/tabs.js";
import "@material/web/select/select-option.js";
import "@material/web/select/outlined-select.js";
import "@material/web/progress/circular-progress.js";

import defaultLines from "./integrations/default-lines";

import ConfigPage from "./pages/Configuration";
import Results from "./pages/Results";
import Drills from "./pages/Drills";
import processNewRepertoire from "./integrations/processNewRepertoire";

import AnalysisDatabase from "./types/AnalysisDatabase";
import Repertoire from "./types/Repertoire";
import Game from "./types/Game";
import Viewer from "./pages/Viewer";
import Book from "./pages/Book";
import TV from "./pages/TV";
import TVPicker from "./pages/TVPicker";
import MissedMovesTV from "./pages/MissedMovesTV";
import ChannelManagement from "./pages/ChannelManagement";
import Notes from "./components/Notes";
import { ChannelForm } from "./pages/ChannelForm";
import { MegaMenu } from "primereact/megamenu";

interface AppProps {
  analysisDatabaseStorage: AnalysisDatabase;
  repertoireStorage: { [name: string]: Repertoire };
  gamesStorage: Game[];
  playerNameStorage: string;
  lichessPlayerNameStorage: string;
  repertoireListStorage: string[];
  userLeftBookOnlyStorage: boolean;
  repertoireChoiceStorage: string;
  // Do this later
  worker: any;
  activeTabStorage: string;
}

function App({
  analysisDatabaseStorage,
  repertoireStorage,
  gamesStorage,
  playerNameStorage,
  lichessPlayerNameStorage,
  repertoireListStorage,
  userLeftBookOnlyStorage,
  repertoireChoiceStorage,
  worker,
  activeTabStorage,
}: AppProps) {
  // Declare main state of application
  // This includes data stored by the application such as the repertoire and player name
  // This application may be a better fit for useReducer due to all the state that we are passing around.
  // The useState effect makes code very explicit about state stuff which is good
  const [playerName, setPlayerName] = useState(playerNameStorage || "");
  const [lichessPlayerName, setLichessPlayerName] = useState(
    lichessPlayerNameStorage || "",
  );


  const [repertoire, setRepertoire]: [
    { [name: string]: Repertoire },
    Dispatch<SetStateAction<{ [name: string]: Repertoire }>>,
  ] = useState(repertoireStorage || {});

  const [repertoireChoice, setRepertoireChoice] = useState(
    repertoireChoiceStorage,
  );
  const [repertoireList, setRepertoireList] = useState(
    repertoireListStorage || [],
  );

  const [games, setGames] = useState(gamesStorage || []);

  const [newRepertoireNameField, setNewRepertoireNameField] = useState("");

  const [userLeftBookOnly, setUserLeftBookOnly] = useState(
    userLeftBookOnlyStorage,
  );

  // tab navigation
  const [activeTab, setActiveTab] = useState(
    (typeof activeTabStorage === "string" && activeTabStorage) || "panel-one",
  );

  // This effect initializes a new repertoire based on some common Queen's Gambit lines if none are found
  useEffect(() => {
    (async () => {
      if (repertoireList.length === 0) {
        setPlayerName("example");
        await setItemDexie("playerName", "example");
        const defaultAnalysisName = "Queen's Gambit";
        await setItemDexie("repertoireChoice", defaultAnalysisName);
        processNewRepertoire(defaultLines, {
          repertoire,
          setRepertoire,
          newRepertoireNameField: defaultAnalysisName,
          setNewRepertoireNameField,
          repertoireList,
          setRepertoireList,
        });
        setRepertoireChoice(defaultAnalysisName);

        setGames(defaultGames);
        await setItemDexie("games", defaultGames);

        await setItemDexie("repertoireChoice", defaultAnalysisName);
      }
    })();
  });

  const [analysisDatabase, dispatchAnalysisDatabase]: [
    AnalysisDatabase,
    (newValue: { type: string; data: AnalysisDatabase }) => void,
  ] = useReducer(analysisDatabaseReducer, analysisDatabaseStorage);

  // If the repertoire or games change, start performing analysis on the games
  useEffect(
    () => {
      if (!repertoireChoice) {
        // Nothing to do here
        return;
      }

      console.log("Calculating analysis for repertoire", repertoireChoice);

      let currentRepertoire = repertoire[repertoireChoice];

      function customSort(item: Game) {
        // For example, sorting based on the 'value' property
        return item.end_time;
      }

      // Sort the array based on the result of the custom function
      const sortedGames = games
        .sort(function (a, b) {
          return customSort(a) - customSort(b);
        })
        .reverse();

      let payload: InnerAnalyzeGamesExpectedMessage = {
        analysisDatabase: analysisDatabase || {},
        repertoire: currentRepertoire || {},
        games: sortedGames || [],
        playerName,
        lichessPlayerName,
      };
      // console.log("Sending ", payload);
      if (worker) {
        worker.postMessage(payload);
        worker.onmessage = (message: {
          data: { currentAnalysisDatabase: AnalysisDatabase };
        }) => {
          // console.log("answer from worker", message);

          dispatchAnalysisDatabase({
            type: "ADD_ANALYSIS",
            data: message.data.currentAnalysisDatabase,
          });
        };
      } else {
        // This section mostly included for unit testing
        console.log("Worker was not available. Starting synchronous analysis");
        // Do it synchronously

        function reportBack(currentAnalysisDatabase: AnalysisDatabase) {
          // console.log("answer from worker", message);

          dispatchAnalysisDatabase({
            type: "ADD_ANALYSIS",
            data: currentAnalysisDatabase,
          });
        }

        let message: AnalyzeGamesExpectedMessage = { data: payload };

        analyzeGames(message, reportBack, reportBack);
      }
    },
    // These effect array items chosen on purpose
    // eslint-disable-next-line
    [repertoire, games],
  );

  // Create the actual pages
  const resultsPage = () => {
    return (
      <Results
        {...{
          games,
          userLeftBookOnly,
          setUserLeftBookOnly,
          playerName,
          playerNameLichess: lichessPlayerName,
          repertoireChoice,
          analysisDatabase,
          setGames,
        }}
      ></Results>
    );
  };

  const configPage = () => (
    <ConfigPage
      {...{
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
      }}
    ></ConfigPage>
  );

  const viewerPage = () => (
    <Book
      {...{
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
      }}
    ></Book>
  );

  const drillPage = () => (
    <Drills
      {...{ games, analysisDatabase, repertoire: repertoire[repertoireChoice] }}
    ></Drills>
  );

  const tvPage = () => { return <TV/> }
  const tvPickerPage = () => { return <TVPicker repertoire={repertoire[repertoireChoice]} /> }

  const repertoireTV = () => { return <MissedMovesTV {...{ games, analysisDatabase }}/>}
  const channelManagement = () => { return <ChannelManagement repertoire={repertoire[repertoireChoice]}/>}

  // set up tab change listener
  useEffect(() => {
    interface SpecialElement extends Element {
      activeTab: Element;
    }

    const tabs: SpecialElement | null = document.querySelector("#nav-tabs");
    if (tabs) {
      tabs.addEventListener("change", () => {
        const panelId = tabs.activeTab?.getAttribute("aria-controls");
        if (panelId) {
          setActiveTab(panelId);
          setItemDexie("activeTab", panelId);
        }
      });
    }
  }, []);

  // hide the inactive tab panels
  const [oneProps, twoProps, threeProps, fourProps] = [
    "panel-one",
    "panel-two",
    "panel-three",
    "panel-four",
  ].map((tabID) => (tabID === activeTab ? {} : { hidden: true }));

  // Add the active property to the appropriate md-primary-tab
  const [oneActive, twoActive, threeActive, fourActive] = [
    "panel-one",
    "panel-two",
    "panel-three",
    "panel-four",
  ].map((tabID) => (tabID === activeTab ? { active: true } : {}));

  const [colorScheme, setColorScheme] = useState(
    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  useEffect(() => {
    const body = document.querySelector("body");

    if (body && colorScheme === "dark") {
      body.className = "dark-mode";
    }

    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").addListener((event) => {
        console.log("Got scheme listener to fire", event);
        const newColorScheme = event.matches ? "dark" : "light";

        setColorScheme(newColorScheme);

        if (body) {
          if (newColorScheme === "dark") {
            body.className = "dark-mode";
          } else {
            body.className = "";
          }
        }
      });
  }, [colorScheme]);

  let classProps = colorScheme === "dark" ? { class: "dark-mode" } : {};


  const channelForm = <ChannelForm repertoire={repertoire[repertoireChoice]} />

  return <>
  <BrowserRouter>
    <Routes>
      <Route element={<Navigator/>}>
        <Route path="/book-it/config" element={configPage()} />
        <Route path="/book-it/results" element={resultsPage()} />
        <Route path="/book-it/drills" element={drillPage()} />
        <Route path="/book-it/viewer" element={viewerPage()} />
        <Route path="/book-it/tv-picker" element={tvPickerPage()} />
        <Route path="/book-it/channels" element={channelManagement()} />
        <Route path="/book-it/tv" element={tvPage()} />
        <Route path="/book-it/repertoire-tv" element={repertoireTV()} />
        <Route path="/book-it/notes" element={<Notes/>} />
        <Route path="/book-it/add-channel" element={channelForm} />
        <Route path="*" element={<Navigate to="/book-it/config/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
  </>
}

function Navigator() {

  const navigate = useNavigate();

  const items = [ { 
    label: "Book It", 
    items:
    [
      {
          label: 'Channels',
          items: [
            { label: 'View Channels', command: () => {
              navigate("/book-it/channels") 
            } }, 
            { label: 'New Channel', command: () => {
              navigate("/book-it/add-channel") 
            } }
          ]
      },
      {
          label: 'Games',
          items: [
            { label: 'Recent Games', command: () => {
              navigate("/book-it/results") 
            } }
          ]
      },

      {
        label: 'Viewer',
        items: [
          { label: 'Repertoires', command: () => {
            navigate("/book-it/viewer") 
          } }
        ]
    },

    {
      label: 'Practice',
      items: [
        { label: 'Drills', command: () => {
          navigate("/book-it/drills") 
        } }
      ]
  },

  {
    label: 'Notes',
    items: [
      { label: 'View Notes', command: () => {
        navigate("/book-it/notes") 
      } }
    ]
},
        {
            label: 'Configuration',
            items: [
              { label: 'Configuration', command: () => {
                navigate("/book-it/config") 
              } }
            ]
        }
    ]}];

  return <>  <MegaMenu model={items} breakpoint="960px" />
  <Outlet/></>


};

export default App;
