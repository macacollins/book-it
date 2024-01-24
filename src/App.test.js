import { fireEvent, render, screen, act } from '@testing-library/react';
import ReactDOM from 'react-dom/client';
import App from './App';

jest.mock("./storage")

// Canary Test
test('renders Configuration Page', async () => {
  await act(() => {
    render(<App />);
  });
  const linkElement = screen.getByText(/Reset Repertoires/i);
  expect(linkElement).toBeInTheDocument();
});


test('Click drills tab', async () => {
  await act(() => {
    render(<App />);
  });
  const linkElement = screen.getByTestId("drills-tab");
  expect(linkElement).toBeInTheDocument();

  await act(() => {
      fireEvent.click(linkElement);
  });
});


test('Fire tabs change event', async () => {
  await act(() => {
    render(<App />);
  });
  const navTab = screen.getByTestId("nav-tabs");
  const linkElement = screen.getByTestId("drills-tab");

  expect(linkElement).toBeInTheDocument();

  await act(() => {
    fireEvent.click(linkElement);
    fireEvent.change(navTab)
  });
});


test('DARK MODE', async () => {

  global.matchMedia = () => {
    return {
      matches: true,
      addListener: jest.fn()
    }
  }

  await act(() => {
    render(<App />);
  });
  const navTab = screen.getByTestId("nav-tabs");
  const linkElement = screen.getByTestId("drills-tab");

  expect(linkElement).toBeInTheDocument();

  await act(() => {
    fireEvent.click(linkElement);
    fireEvent.change(navTab)
  });
});


test('Dark mode switch during app run', async () => {

  let listener;
  function addListener(newListener) {
    listener = newListener;
  }

  global.matchMedia = () => {
    return {
      matches: true,
      addListener: addListener
    }
  }

  await act(() => {
    render(<App />);
  });

  await act(() => {
    listener({matches: true})
  })

  await act(() => {
    listener({matches: false})
  })

});



test('Mocked worker', async () => {

  let postMessage = jest.fn();
  let worker = { postMessage }

  await act(() => {
    render(<App worker={worker}/>);
  });

  expect(postMessage).toHaveBeenCalled();


  await act(() => {
    worker.onmessage({ data: {currentAnalysisDatabase: {}} });
  });

});
