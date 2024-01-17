import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock("./storage")

// Canary Test
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/Reset Repertoires/i);
  expect(linkElement).toBeInTheDocument();
});
