import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { syncChessComGames } from '../database/syncChessComGames';
import { syncLichessGames } from '../database/syncLichessGames';

const LAST_REFRESH_KEY = 'gameRefresherLastRefresh';
const REFRESH_INTERVAL_KEY = 'gameRefresherInterval';

const INTERVAL_OPTIONS = [
  { label: '1 minute', value: 1 * 60 * 1000 },
  { label: '3 minutes', value: 3 * 60 * 1000 },
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '10 minutes', value: 10 * 60 * 1000 },
  { label: '60 minutes', value: 60 * 60 * 1000 }
];

const DEFAULT_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface GameRefresherProps {
  onGamesRefreshed?: () => void;
}

export const GameRefresher: React.FC<GameRefresherProps> = ({ onGamesRefreshed }) => {
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(() => {
    const stored = localStorage.getItem(LAST_REFRESH_KEY);
    return stored ? parseInt(stored, 10) : null;
  });
  
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const stored = localStorage.getItem(REFRESH_INTERVAL_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_INTERVAL;
  });
  
  const [currentlyRefreshing, setCurrentlyRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSyncsRef = useRef(0);

  // Get usernames from localStorage (same keys as Database.tsx)
  const chessComUsername = localStorage.getItem('chessComUsername') || '';
  const lichessUsername = localStorage.getItem('lichessUsername') || '';

  // Persist lastRefreshTime to localStorage
  useEffect(() => {
    if (lastRefreshTime !== null) {
      localStorage.setItem(LAST_REFRESH_KEY, lastRefreshTime.toString());
    }
  }, [lastRefreshTime]);

  // Persist refreshInterval to localStorage
  useEffect(() => {
    localStorage.setItem(REFRESH_INTERVAL_KEY, refreshInterval.toString());
  }, [refreshInterval]);

  const handleSyncComplete = useCallback(() => {
    pendingSyncsRef.current -= 1;
    if (pendingSyncsRef.current <= 0) {
      pendingSyncsRef.current = 0;
      setCurrentlyRefreshing(false);
      setLastRefreshTime(Date.now());
    }
  }, []);

  const handleSuccess = useCallback((message: string) => {
    setStatusMessages(prev => [...prev, message]);
    onGamesRefreshed?.();
  }, [onGamesRefreshed]);

  const handleError = useCallback((message: string) => {
    setStatusMessages(prev => [...prev, `Error: ${message}`]);
  }, []);

  const triggerSync = useCallback(() => {
    if (currentlyRefreshing) return;

    const hasChessCom = !!chessComUsername.trim();
    const hasLichess = !!lichessUsername.trim();

    if (!hasChessCom && !hasLichess) {
      setStatusMessages(['No usernames configured. Please set usernames in the Database page.']);
      return;
    }

    setStatusMessages([]);
    pendingSyncsRef.current = 0;

    if (hasChessCom) {
      pendingSyncsRef.current += 1;
      syncChessComGames({
        username: chessComUsername,
        onStart: () => setCurrentlyRefreshing(true),
        onComplete: handleSyncComplete,
        onSuccess: handleSuccess,
        onError: handleError,
        onDataChanged: () => {} // Handled via onSuccess
      });
    }

    if (hasLichess) {
      pendingSyncsRef.current += 1;
      syncLichessGames({
        username: lichessUsername,
        onStart: () => setCurrentlyRefreshing(true),
        onComplete: handleSyncComplete,
        onSuccess: handleSuccess,
        onError: handleError,
        onDataChanged: () => {} // Handled via onSuccess
      });
    }
  }, [currentlyRefreshing, chessComUsername, lichessUsername, handleSyncComplete, handleSuccess, handleError]);

  // Auto-refresh logic
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If no lastRefreshTime and not currently refreshing, trigger initial sync
    if (lastRefreshTime === null && !currentlyRefreshing) {
      triggerSync();
      return;
    }

    // Calculate next refresh time
    if (lastRefreshTime !== null) {
      const nextRefreshTime = lastRefreshTime + refreshInterval;
      const timeUntilRefresh = nextRefreshTime - Date.now();

      if (timeUntilRefresh <= 0) {
        // Time to refresh now
        if (!currentlyRefreshing) {
          triggerSync();
        }
      } else {
        // Schedule refresh
        timeoutRef.current = setTimeout(() => {
          if (!currentlyRefreshing) {
            triggerSync();
          }
        }, timeUntilRefresh);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [lastRefreshTime, refreshInterval, currentlyRefreshing, triggerSync]);

  const formatLastRefresh = () => {
    if (lastRefreshTime === null) {
      return 'Never';
    }
    return new Date(lastRefreshTime).toLocaleString();
  };

  const handleIntervalChange = (newInterval: number) => {
    setRefreshInterval(newInterval);
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button 
        label="Sync Now" 
        icon="bi bi-arrow-repeat" 
        onClick={triggerSync}
        disabled={currentlyRefreshing}
        loading={currentlyRefreshing}
      />
      <Button 
        label="Close" 
        className="p-button-secondary" 
        onClick={() => setDialogVisible(false)}
      />
    </div>
  );

  return (
    <>
      {currentlyRefreshing ? (
        <ProgressSpinner 
          style={{ width: '24px', height: '24px' }} 
          strokeWidth="4"
        />
      ) : (
        <Button 
          icon="bi bi-arrow-repeat" 
          className="p-button-text p-button-rounded"
          onClick={() => setDialogVisible(true)}
          tooltip="Game Sync Settings"
        />
      )}

      <Dialog
        header="Game Sync"
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        style={{ width: '400px' }}
        footer={dialogFooter}
        modal
      >
        <div className="flex flex-column gap-3">
          <div>
            <label className="font-semibold block mb-2">Last Refresh</label>
            <span>{formatLastRefresh()}</span>
          </div>

          <div>
            <label className="font-semibold block mb-2">Auto-Refresh Interval</label>
            <Dropdown
              value={refreshInterval}
              options={INTERVAL_OPTIONS}
              onChange={(e) => handleIntervalChange(e.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">Configured Accounts</label>
            <ul className="m-0 pl-3">
              {chessComUsername ? (
                <li>Chess.com: {chessComUsername}</li>
              ) : (
                <li className="text-secondary">Chess.com: Not configured</li>
              )}
              {lichessUsername ? (
                <li>Lichess: {lichessUsername}</li>
              ) : (
                <li className="text-secondary">Lichess: Not configured</li>
              )}
            </ul>
          </div>

          {statusMessages.length > 0 && (
            <div>
              <label className="font-semibold block mb-2">Status</label>
              <ul className="m-0 pl-3">
                {statusMessages.map((msg, idx) => (
                  <li key={idx} className={msg.startsWith('Error') ? 'text-red-500' : ''}>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};
