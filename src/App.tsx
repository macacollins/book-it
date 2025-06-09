import "./App.css";

import {
  useState,
  useEffect,
  useReducer,
  Dispatch,
  SetStateAction,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useNavigate,
  HashRouter,
} from "react-router";
import { setItemDexie } from "./storage";

import defaultGames from "./integrations/default-games";

import analysisDatabaseReducer from "./reducers/analysisDatabase";
import analyzeGames, {
  AnalyzeGamesExpectedMessage,
  InnerAnalyzeGamesExpectedMessage,
} from "./analysis/analyzeGames";

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
import ChannelViewer from "./pages/ChannelViewer";
import Annotations from "./pages/Annotations";
import { ChannelForm } from "./pages/ChannelForm";
import { Menubar } from 'primereact/menubar';
import { MenuItem } from "primereact/menuitem";
import RepertoireSelection from "./pages/RepertoireSelection";
import RepertoireChapterSelection from "./pages/RepertoireChapterSelection";
import RepertoireLineSelection from "./pages/RepertoireLineSelection";
import RepertoireLineViewer from "./pages/RepertoireLineViewer";

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

  const tvPickerPage = () => {
    return <TVPicker repertoire={repertoire[repertoireChoice]} />;
  };

  const repertoireTV = () => {
    return <MissedMovesTV {...{ games, analysisDatabase }} />;
  };
  const channelManagement = () => {
    return <ChannelManagement />;
  };

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

  const channelForm = <ChannelForm repertoire={repertoire[repertoireChoice]} />;

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<Navigator />}>
            <Route path="/book-it/config" element={configPage()} />
            <Route path="/book-it/results" element={resultsPage()} />
            <Route path="/book-it/drills" element={drillPage()} />
            <Route path="/book-it/viewer" element={viewerPage()} />
            <Route path="/book-it/repertoires" element={<RepertoireSelection repertoireList={repertoireList} />} />
            <Route path="/book-it/repertoires/:repertoirePathName" element={<RepertoireChapterSelection repertoireList={repertoireList}/>} />
            <Route path="/book-it/repertoires/:repertoirePathName/:chapter" element={<RepertoireLineSelection repertoireList={repertoireList} />} />
            <Route path="/book-it/repertoires/:repertoirePathName/:chapter/:line" element={<RepertoireLineViewer repertoireList={repertoireList} />} />
            <Route path="/book-it/tv-picker" element={tvPickerPage()} />
            <Route path="/book-it/channels" element={channelManagement()} />
            <Route path="/book-it/channels/:channelName" element={<ChannelViewer/>} />
            <Route path="/book-it/tv" element={<TV />} />
            <Route path="/book-it/repertoire-tv" element={repertoireTV()} />
            <Route path="/book-it/notes" element={<Notes />} />
            <Route path="/book-it/annotations" element={<Annotations />} />
            <Route path="/book-it/add-channel" element={channelForm} />
            <Route
              path="*"
              element={<Navigate to="/book-it/config/" replace />}
            />
          </Route>
        </Routes>
      </HashRouter>
    </>
  );
}

function Navigator() {
  const navigate = useNavigate();


  const items = [
    {
      label: "Book It",
      items: [
        {
          label: "TV",
          items: [
            {
              label: "TV",
              command: () => {
                navigate("/book-it/channels");
              },
            },
          ],
        },
        {
          label: "Games",
          items: [
            {
              label: "Games",
              command: () => {
                navigate("/book-it/results");
              },
            },
          ],
        },

        {
          label: "Viewer",
          items: [
            {
              label: "Repertoires",
              command: () => {
                navigate("/book-it/viewer");
              },
            },
          ],
        },

        {
          label: "Practice",
          items: [
            {
              label: "Drills",
              command: () => {
                navigate("/book-it/drills");
              },
            },
          ],
        },

        {
          label: "Notes",
          items: [
            {
              label: "Notes",
              command: () => {
                navigate("/book-it/notes");
              },
            },
          ],
        },
        {
          label: "Configuration",
          items: [
            {
              label: "Configuration",
              command: () => {
                navigate("/book-it/config");
              },
            },
          ],
        },
      ],
    },
  ];

  const itemsFlat: MenuItem[] = [];

  items.forEach(item => {
    item.items.forEach(innerItem => {
      innerItem.items.forEach(reallyInnerItem => {
        itemsFlat.push(reallyInnerItem);

      })
    })
  })

  return (
    <>
      <Menubar model={itemsFlat} />
      <main className="md:m-3">
        <Outlet />
      </main>
    </>
  );
}

export default App;
