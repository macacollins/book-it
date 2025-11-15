import React, { useState } from 'react';
import FENChooser from './FENChooser';
import NotesForFEN from './NotesForFEN';
import MastersStatistics from './MastersStatistics';
import LichessStatistics from './LichessStatistics';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { TabView, TabPanel } from 'primereact/tabview';

interface NotesForFENWrapperProps {
  initialFEN?: string;
  repertoire?: string;
}

/**
 * Wrapper component that combines FENChooser with NotesForFEN
 * for demonstrating the notes functionality in Storybook
 */
export default function NotesForFENWrapper({
  initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  repertoire = 'Demo Repertoire',
}: NotesForFENWrapperProps) {
  const [selectedFEN, setSelectedFEN] = useState<string>(initialFEN);

  const handleFENChange = (newFEN: string) => {
    setSelectedFEN(newFEN);
  };

  return (
    <div>
      <Splitter className="mb-3">
        <SplitterPanel className="flex align-items-center justify-content-center" size={50}>
          <div className="p-3 w-full">
            <h3 className="mt-3">FEN Position Selector</h3>
            <FENChooser
              initialFEN={selectedFEN}
              onFENChange={handleFENChange}
            />
          </div>
        </SplitterPanel>
        
        <SplitterPanel className="flex align-items-start justify-content-center" size={50}>
          <div className="w-full">
            <TabView>
              <TabPanel header="Notes">
                <div className="p-3">
                  <h3 className="mt-0">Notes for Position</h3>
                  <NotesForFEN
                    fen={selectedFEN}
                    repertoire={repertoire}
                    placeholder="Enter your notes for this chess position..."
                    rows={12}
                  />
                </div>
              </TabPanel>
              <TabPanel header="Masters">
                <MastersStatistics fen={selectedFEN} />
              </TabPanel>
              <TabPanel header="Lichess Stats">
                <LichessStatistics fen={selectedFEN} />
              </TabPanel>
            </TabView>
          </div>
        </SplitterPanel>
      </Splitter>
      
      <div className="mt-3 p-3 bg-gray-100 border-round">
        <h4 className="mt-0">Usage Instructions:</h4>
        <ul className="pl-4">
          <li>Select a FEN position using the chooser on the left</li>
          <li><strong>Notes tab:</strong> Enter notes in the text area (auto-saved after 1 second)</li>
          <li><strong>Masters tab:</strong> View statistics from the Lichess masters database</li>
          <li><strong>Lichess Stats tab:</strong> View statistics from Lichess games (1600-2000 rated players)</li>
          <li>All data is loaded automatically when you change the FEN position</li>
        </ul>
      </div>
    </div>
  );
}