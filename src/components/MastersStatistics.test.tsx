import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MastersStatistics from './MastersStatistics';

// Mock the LichessClient
jest.mock('../integrations/lichess-client', () => ({
  LichessClient: jest.fn().mockImplementation(() => ({
    openingExplorerMaster: jest.fn().mockResolvedValue({
      opening: {
        eco: 'E04',
        name: 'Catalan Opening'
      },
      white: 150,
      black: 100,
      draws: 50,
      moves: [
        { san: 'Nf6', white: 80, black: 60, draws: 20 },
        { san: 'd5', white: 70, black: 40, draws: 30 }
      ],
      topGames: [
        {
          id: 'game1',
          white: { name: 'Kasparov', rating: 2800 },
          black: { name: 'Karpov', rating: 2750 },
          year: 1984,
          winner: 'white'
        }
      ]
    })
  }))
}));

describe('MastersStatistics', () => {
  const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  it('renders loading state initially', async () => {
    render(<MastersStatistics fen={testFen} />);
    expect(screen.getByText('Loading masters data...')).toBeInTheDocument();
  });

  it('renders masters data when loaded', async () => {
    render(<MastersStatistics fen={testFen} />);

    await waitFor(() => {
      expect(screen.getByText('Masters Database Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('Catalan Opening')).toBeInTheDocument();
    expect(screen.getByText('ECO: E04')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument(); // Total games
    expect(screen.getByText('150')).toBeInTheDocument(); // White wins
  });

  it('handles empty FEN gracefully', () => {
    render(<MastersStatistics fen="" />);
    // Should not make API call with empty FEN
    expect(screen.queryByText('Loading masters data...')).not.toBeInTheDocument();
  });
});