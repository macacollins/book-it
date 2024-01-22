import { render, screen, act } from '@testing-library/react';
import ReactDOM from 'react-dom/client';
import App from './App';

jest.mock("./storage")

// Canary Test
test('renders learn react link', async () => {
  await act(() => {
    render(<App />);
  });
  const linkElement = screen.getByText(/Reset Repertoires/i);
  expect(linkElement).toBeInTheDocument();
});
