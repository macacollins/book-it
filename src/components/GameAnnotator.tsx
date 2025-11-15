import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import { calculateMoveTreeFromParsedPGN } from '../integrations/calculateMoveTree';
import { MoveTree } from '../types/MoveTree';
import { LichessClient, GameJson } from '../integrations/lichess-client';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import { getGameAnnotations, getNotesWordCount, saveGameAnnotations } from '../services/AnnotationsService';

interface GameAnnotatorProps {
  className?: string;
}

interface GameRow {
  id: string;
  date: string;
  eco: string;
  result: string;
  pgn: string;
  white: string;
  black: string;
  timeControl: string;
  termination: string;
  event: string;
  site: string;
  opening: string;
}

const startingFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const GameAnnotator: React.FC<GameAnnotatorProps> = ({ className = '' }) => {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentMoveTree, setCurrentMoveTree] = useState<MoveTree | null>(null);
  const [currentPosition, setCurrentPosition] = useState(startingFEN);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [positionNotes, setPositionNotes] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<Map<string, string>>(new Map());
  const [isGameLoadingCollapsed, setIsGameLoadingCollapsed] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<any>({});
  
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const lichessClient = new LichessClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize component with cached data
  useEffect(() => {
    const initializeFromCache = async () => {
      try {
        const cachedUsername = localStorage.getItem('lichess-username');
        const cachedGameId = localStorage.getItem('game-annotator-current-game-id');
        const cachedMoveIndex = localStorage.getItem('game-annotator-current-move-index');
        
        if (cachedUsername) {
          setUsername(cachedUsername);
          // Auto-load games if we have cached username
          await loadGamesWithUsername(cachedUsername);
          
          // Store cached game data for later restoration
          if (cachedGameId && cachedMoveIndex) {
            // We'll restore this after games are loaded
            localStorage.setItem('game-annotator-pending-restore', JSON.stringify({
              gameId: cachedGameId,
              moveIndex: parseInt(cachedMoveIndex, 10)
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading cached data:', err);
      }
    };

    initializeFromCache();
  }, []); // Run once on component mount

  // Keyboard navigation effect
  useEffect(() => {
    if (!currentMoveTree) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousMove();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextMove();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMoveTree, currentMoveIndex]);

  // Update notes when position changes
  useEffect(() => {
    if (currentPosition) {
      // Clear any pending save when position changes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      const existingNotes = savedNotes.get(currentPosition) || '';
      setPositionNotes(existingNotes);
    }
  }, [currentPosition, savedNotes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const loadGamesWithUsername = async (targetUsername: string) => {
    if (!targetUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setGames([]);

    try {
      const cacheKey = `lichess-games-${targetUsername.trim()}`;
      
      // Check for cached data first
      let gameData;
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Check if cache is less than 1 hour old
          const cacheAge = Date.now() - parsed.timestamp;
          const oneHour = 60 * 60 * 1000;
          
          if (cacheAge < oneHour) {
            gameData = parsed.data;
            setSuccess(`Loaded ${Array.isArray(gameData) ? gameData.length : 1} games (from cache)`);
          }
        }
      } catch (cacheErr) {
        console.warn('Error reading cache:', cacheErr);
      }

      // If no valid cache, fetch from API
      if (!gameData) {
        // Calculate timestamp for 3 months ago
        const threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000);
        
        gameData = await lichessClient.apiGamesUser(targetUsername.trim(), {
          since: threeMonthsAgo,
          max: 100,
          moves: true,
          opening: true,
          tags: true,
          sort: 'dateDesc',
          pgnInJson: true
        });

        // Cache the result
        try {
          const cacheData = {
            data: gameData,
            timestamp: Date.now()
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (cacheErr) {
          console.warn('Error saving to cache:', cacheErr);
        }

        setSuccess(`Loaded ${Array.isArray(gameData) ? gameData.length : 1} games (from API)`);
      }

      // Handle both single game and array of games
      const gamesArray = Array.isArray(gameData) ? gameData : [gameData];
      
      const processedGames: GameRow[] = gamesArray.map((game: GameJson) => {
        const date = new Date(game.createdAt).toLocaleDateString();
        const eco = game.opening?.eco || 'Unknown';
        const opening = game.opening?.name || 'Unknown';

        const annotationWordCount = getNotesWordCount(game.id);
        
        // Determine result from winner and players
        let result = '1/2-1/2'; // Draw by default
        if (game.winner) {
          if (game.players.white.user?.name === targetUsername && game.winner === 'white') {
            result = 'win';
          } else if (game.players.black.user?.name === targetUsername && game.winner === 'black') {
            result = 'win';
          } else if (game.players.white.user?.name === targetUsername && game.winner === 'black') {
            result = 'loss';
          } else if (game.players.black.user?.name === targetUsername && game.winner === 'white') {
            result = 'loss';
          }
        }

        return {
          id: game.id,
          date,
          eco,
          result,
          pgn: game.pgn || '',
          white: game.players.white.user?.name || 'Anonymous',
          black: game.players.black.user?.name || 'Anonymous',
          timeControl: game.clock ? `${game.clock.initial}+${game.clock.increment}` : 'Unlimited',
          termination: game.status,
          event: game.perf || 'Unknown',
          site: 'lichess.org',
          opening,
          annotationWordCount
        };
      });

      setGames(processedGames);
      
      // Auto-collapse after games are loaded
      if (processedGames.length > 0) {
        setIsGameLoadingCollapsed(true);
      }
    } catch (err) {
      setError(`Failed to load games: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const cacheGameState = (gameId: string | null, moveIndex: number) => {
    try {
      if (gameId) {
        localStorage.setItem('game-annotator-current-game-id', gameId);
        localStorage.setItem('game-annotator-current-move-index', moveIndex.toString());
      } else {
        localStorage.removeItem('game-annotator-current-game-id');
        localStorage.removeItem('game-annotator-current-move-index');
      }
    } catch (err) {
      console.warn('Error caching game state:', err);
    }
  };

  const loadGames = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    // Cache the username
    try {
      localStorage.setItem('lichess-username', username.trim());
    } catch (err) {
      console.warn('Error caching username:', err);
    }

    await loadGamesWithUsername(username.trim());
  };

  const loadGame = async (game: GameRow, moveIndex: number = 0) => {
    if (!game.pgn) {
      // Need to fetch the full game with PGN
      try {
        const fullGame = await lichessClient.gamePgn(game.id, {
            moves: true,
            pgnInJson: true,
            tags: true,
            clocks: true,
            evals: true,
            accuracy: true,
            opening: true,
            division: true,
            literate: true,
            withBookmarked: true
        });
        
        if (fullGame.pgn) {
          game.pgn = fullGame.pgn;
        }
      } catch (err) {
        setError(`Failed to load game PGN: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }
    }

    try {
      const parsedPGNs: ParsedPGN[] = pgnParser.parse(game.pgn);
      
      if (parsedPGNs.length === 0) {
        setError('No valid PGN found in the game.');
        return;
      }

      const firstPGN = parsedPGNs[0];
      const moveTree = calculateMoveTreeFromParsedPGN([firstPGN], `Game: ${game.white} vs ${game.black}`);
      if (moveTree) {
        setCurrentMoveTree(moveTree);
        setSelectedGame(game);
        // resetToStartingPosition();
        setSuccess(`Loaded game: ${game.white} vs ${game.black}`);
        // Cache the selected game
        // cacheGameState(game.id, 0);
        setTimeout(() => {
            navigateToMoveByIndex(moveIndex, moveTree);
            setCurrentMoveIndex(moveIndex);
        }, 500)
      }
    } catch (err) {
      setError(`Failed to process game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error processing game:', err);
    }
  };

  const resetToStartingPosition = () => {
    gameRef.current = new Chess();
    setCurrentPosition(startingFEN);
    setCurrentMoveIndex(0);
    
    // Cache the reset position
    if (selectedGame) {
      cacheGameState(selectedGame.id, 0);
    }
    
    if (chessboardRef.current) {
      chessboardRef.current.position(startingFEN);
    }
  };

  const navigateToMove = (targetFen: string, moveIndex?: number) => {
    try {
    //   gameRef.current = new Chess(targetFen);
      setCurrentPosition(targetFen);
      
      const newMoveIndex = moveIndex !== undefined ? moveIndex : 0;
      setCurrentMoveIndex(newMoveIndex);
      
      // Cache the current move index
      if (selectedGame) {
        cacheGameState(selectedGame.id, newMoveIndex);
      }
      
      if (chessboardRef.current) {
        chessboardRef.current.position(targetFen);
      }
    } catch (err) {
      console.error('Error navigating to position:', err);
    }
  };

  const navigateToMoveByIndex = (index: number, moveTree?: MoveTree) => {
    // if (index < -1 || index >= currentMoveTree) return;

    const realMoveTree = moveTree || currentMoveTree;
    
    if (index === -1) {
      resetToStartingPosition();
    } else {

        let startNode = realMoveTree?.nodes[0];
        let current = startNode?.children[0];
        if (!current) return;

        for (let i = 0; i < index + 1; i++) {
          current = current.children[0];
          if (!current) return;
        }
        
        navigateToMove(current.fen, index);
    }
  };

  const goToPreviousMove = () => {
    navigateToMoveByIndex(currentMoveIndex - 1);
  };

  const goToNextMove = () => {
    navigateToMoveByIndex(currentMoveIndex + 1);
  };

  const saveNotes = (currentPositionNotes: string) => {
    const newSavedNotes = new Map(savedNotes);
    newSavedNotes.set(currentPosition, currentPositionNotes);
    setSavedNotes(newSavedNotes);
    
    // Save to localStorage using AnnotationsService
    if (selectedGame?.id) {
      const notesData = Object.fromEntries(newSavedNotes);
      saveGameAnnotations(selectedGame.id, notesData);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPositionNotes(e.target.value);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout to auto-save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(e.target.value);
    }, 1000);
  };

  // Restore cached game state when games are loaded
  useEffect(() => {
    if (games.length > 0) {
      try {
        const pendingRestore = localStorage.getItem('game-annotator-pending-restore');
        if (pendingRestore) {
          const { gameId, moveIndex } = JSON.parse(pendingRestore);
          localStorage.removeItem('game-annotator-pending-restore');
          
          // Find and restore the cached game
          const gameToRestore = games.find(game => game.id === gameId);
          if (gameToRestore) {
            setTimeout(async () => {
              await loadGame(gameToRestore, moveIndex);
            }, 100);
          }
        }
      } catch (err) {
        console.warn('Error restoring cached game state:', err);
      } finally {
        localStorage.removeItem('game-annotator-pending-restore');
      }
    }
  }, [games]);

  // Load saved notes when a game is selected
  useEffect(() => {
    if (selectedGame) {
      const notesData = getGameAnnotations(selectedGame.id);
      setSavedNotes(new Map(Object.entries(notesData)));
    }
  }, [selectedGame]);

  const dateBodyTemplate = (rowData: GameRow) => {
    return rowData.date;
  };

  const ecoBodyTemplate = (rowData: GameRow) => {
    return rowData.opening;
  };

  const resultBodyTemplate = (rowData: GameRow) => {
    return rowData.result;
  };

  const loadButtonTemplate = (rowData: GameRow) => {
    return (
      <Button 
        label="Load" 
        size="small"
        onClick={() => loadGame(rowData)}
        disabled={loading}
      />
    );
  };

  const rowExpansionTemplate = (data: GameRow) => {
    return (
      <div className="p-3">
        <h5>Game Details</h5>
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="font-semibold pr-4">White:</td><td>{data.white}</td></tr>
            <tr><td className="font-semibold pr-4">Black:</td><td>{data.black}</td></tr>
            <tr><td className="font-semibold pr-4">Event:</td><td>{data.event}</td></tr>
            <tr><td className="font-semibold pr-4">Site:</td><td>{data.site}</td></tr>
            <tr><td className="font-semibold pr-4">Time Control:</td><td>{data.timeControl}</td></tr>
            <tr><td className="font-semibold pr-4">Termination:</td><td>{data.termination}</td></tr>
            <tr><td className="font-semibold pr-4">Opening:</td><td>{data.opening}</td></tr>
          </tbody>
        </table>
      </div>
    );
  };

  const cardHeader = (
    <div className="flex justify-content-between align-items-center">
      <h1>Game Annotator
        {games.length > 0 && (
            <Button
                label="expand"            
                onClick={() => setIsGameLoadingCollapsed(!isGameLoadingCollapsed)}
                className="p-button-text p-button-sm"
                tooltip={isGameLoadingCollapsed ? "Expand game loading" : "Collapse game loading"}
            />
        )}
      </h1>
      
    </div>
  );

  return (
    <div className={`game-annotator ${className}`}>
    
      {isGameLoadingCollapsed ? (!currentMoveTree && cardHeader) : (
        <Card header={cardHeader} className="mb-4">
          <div className="p-fluid">
            <div className="field">
              <label htmlFor="username">Lichess Username</label>
              <div className="p-inputgroup">
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Cache username as user types
                    try {
                      if (e.target.value.trim()) {
                        localStorage.setItem('lichess-username', e.target.value.trim());
                      }
                    } catch (err) {
                      console.warn('Error caching username:', err);
                    }
                  }}
                  placeholder="Enter lichess username"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && loadGames()}
                />
                <Button 
                  label="Load Games" 
                  onClick={loadGames}
                  disabled={loading || !username.trim()}
                  loading={loading}
                />
              </div>
            </div>

            {error && (
              <Message severity="error" text={error} className="mb-3" />
            )}

            {success && (
              <Message severity="success" text={success} className="mb-3" />
            )}

            {loading && (
              <div className="text-center my-4">
                <ProgressSpinner />
                <p>Loading games...</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {!currentMoveTree && 
            <Card title="Games" className="h-full">
              <DataTable
                value={games}
                expandedRows={expandedRows} 
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                dataKey="id"
                size="small"
                scrollable
                scrollHeight="450px"
              >
                <Column expander style={{ width: '3em' }} />
                <Column field="date" header="Date" body={dateBodyTemplate} />
                <Column field="name" header="ECO" body={ecoBodyTemplate} />
                <Column field="result" header="Result" body={resultBodyTemplate} />
                <Column field="annotationWordCount" header="Annotation Word Count" />
                <Column body={loadButtonTemplate} header="Load" />
              </DataTable>
            </Card>}

      {currentMoveTree && (
        <Splitter>
        
          <SplitterPanel size={50} minSize={50}>
            <Card title={selectedGame ? `${selectedGame.white} vs ${selectedGame.black}` : "Select a game"} className="h-full">
              {currentMoveTree ? (
                <div className="flex flex-column h-full">
                  <ChessBoard 
                    name="game-annotator"
                    game_url={selectedGame?.id || 'annotator'}
                    chessboardRef={chessboardRef}
                    size="400px"
                    fen={startingFEN}
                    draggable={false}
                  />
                  
                  <div className="flex-1">
                    <div className="flex gap-2 mb-3">
                      <Button 
                        label="Previous" 
                        icon="pi pi-chevron-left"
                        onClick={goToPreviousMove}
                        disabled={currentMoveIndex <= -1}
                        size="small"
                      />
                      <Button 
                        label="Next" 
                        icon="pi pi-chevron-right"
                        iconPos="right"
                        onClick={goToNextMove}
                        disabled={false}
                        size="small"
                      />
                      <Button 
                        label="Start" 
                        onClick={resetToStartingPosition}
                        size="small"
                      />
                      {currentMoveIndex}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex align-items-center justify-content-center h-full">
                  <p>Load a game to start annotating</p>
                </div>
              )}
            </Card>
          </SplitterPanel>

          <SplitterPanel size={50} minSize={50}>
            <Card title={`Position Notes (${getNotesWordCount(selectedGame?.id || "")})`} className="h-full">
              {currentMoveTree ? (
                <div className="flex flex-column h-full">
                  <div className="flex-1">
                    <InputTextarea
                      value={positionNotes}
                      onChange={handleNotesChange}
                      placeholder="Add notes for this position..."
                      rows={15}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <Button 
                      label="Select a New Game" 
                      onClick={() => {
                        setCurrentMoveTree(null);
                        setSelectedGame(null);
                        setCurrentMoveIndex(0);
                        setCurrentPosition(startingFEN);
                        cacheGameState(null, 0);
                      }}
                      size="small"
                      className="w-full"
                    />
                  </div>

                  <div className="text-xs text-500 mt-2">
                    FEN: {currentPosition}
                  </div>
                </div>
              ) : (
                <div className="flex align-items-center justify-content-center h-full">
                  <p>Notes will appear here</p>
                </div>
              )}
            </Card>
          </SplitterPanel>
        </Splitter>
      )}
    </div>
  );
};

export default GameAnnotator;