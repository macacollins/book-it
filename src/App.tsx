import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import DatabasePage from './pages/DatabasePage';
import GameAnnotatorPage from './pages/GameAnnotatorPage';
import RepertoireDiffPage from './pages/RepertoireDiffPage';
import TacticsPracticePage from './pages/TacticsPracticePage';
import RepertoireDrillPage from './pages/RepertoireDrillPage';
import { SavedGameClient } from './database/SavedGameClient';
import { Menubar } from 'primereact/menubar';
import './App.css';
import { MegaMenu } from 'primereact/megamenu';
import Notes from './components/Notes';
import useWindowSize from './hooks/useWindowSize';

function App() {
  const [hasGames, setHasGames] = useState<boolean | null>(null);
  const [width] = useWindowSize();
  const isCompact = width > 0 && width < 640;

  useEffect(() => {
    const checkForGames = async () => {
      const gameCount = await SavedGameClient.count();
      setHasGames(gameCount > 0);
    };
    checkForGames();
  }, []);

  const menuItems = [
    {
      label: isCompact ? undefined : 'Database',
      icon: 'bi bi-database',
      command: () => { window.location.hash = '#/database'; }
    },
    // {
    //   label: 'Game Annotator',
    //   icon: 'bi bi-pencil',
    //   command: () => { window.location.hash = '#/annotator'; }
    // },
    {
      label: isCompact ? undefined : 'Game Analysis',
      icon: 'bi bi-stars',
      command: () => { window.location.hash = '#/diff'; }
    },
    {
      label: isCompact ? undefined : 'Tactics',
      icon: 'bi bi-lightning-fill',
      command: () => { window.location.hash = '#/tactics'; }
    },
    {
      label: isCompact ? undefined : 'Repertoire Drill',
      icon: 'bi bi-play-fill',
      command: () => { window.location.hash = '#/repertoire-drill'; }
    }
  ];

  if (hasGames === null) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <i className="bi bi-arrow-repeat" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}></i>
      </div>
    );
  }

  const defaultRoute = hasGames ? '/annotator' : '/database';

  return (
    <HashRouter>
      <div className="app-container">
        <MegaMenu breakpoint="275px" model={menuItems} />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            <Route path="/database" element={<DatabasePage />} />
            {/* <Route path="/annotator" element={<GameAnnotatorPage />} /> */}
            <Route path="/diff" element={<RepertoireDiffPage />} />
            <Route path="/tactics" element={<TacticsPracticePage />} />
            <Route path="/repertoire-drill" element={<RepertoireDrillPage />} />
            <Route path="/notes" element={<Notes />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;