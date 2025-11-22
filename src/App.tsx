import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import DatabasePage from './pages/DatabasePage';
import GameAnnotatorPage from './pages/GameAnnotatorPage';
import RepertoireDiffPage from './pages/RepertoireDiffPage';
import TacticsPracticePage from './pages/TacticsPracticePage';
import { SavedGameClient } from './database/SavedGameClient';
import { Menubar } from 'primereact/menubar';
import './App.css';

function App() {
  const [hasGames, setHasGames] = useState<boolean | null>(null);

  useEffect(() => {
    const checkForGames = async () => {
      const gameCount = await SavedGameClient.count();
      setHasGames(gameCount > 0);
    };
    checkForGames();
  }, []);

  const menuItems = [
    {
      label: 'Database',
      icon: 'pi pi-database',
      command: () => { window.location.hash = '#/database'; }
    },
    {
      label: 'Game Annotator',
      icon: 'pi pi-pencil',
      command: () => { window.location.hash = '#/annotator'; }
    },
    {
      label: 'Repertoire Diff',
      icon: 'pi pi-chart-line',
      command: () => { window.location.hash = '#/diff'; }
    },
    {
      label: 'Tactics Practice',
      icon: 'pi pi-bolt',
      command: () => { window.location.hash = '#/tactics'; }
    }
  ];

  if (hasGames === null) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
      </div>
    );
  }

  const defaultRoute = hasGames ? '/annotator' : '/database';

  return (
    <HashRouter>
      <div className="app-container">
        <Menubar model={menuItems} />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/annotator" element={<GameAnnotatorPage />} />
            <Route path="/diff" element={<RepertoireDiffPage />} />
            <Route path="/tactics" element={<TacticsPracticePage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;