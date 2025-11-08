import React, { useState, useEffect, ReactNode } from 'react';

import "../App.css";
import "./../index.css"

// Extend Window interface to include jQuery and Chessboard
declare global {
  interface Window {
    jQuery?: any;
    Chessboard?: any;
  }
}

interface ChessBoardLoaderProps {
  children: ReactNode;
}

const ChessBoardLoader: React.FC<ChessBoardLoaderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if scripts are already loaded
    const jqueryExists = window.jQuery !== undefined;
    const chessboardExists = window.Chessboard !== undefined;
    
    if (jqueryExists && chessboardExists) {
      setIsLoaded(true);
      return;
    }

    // If not loaded and not currently loading, start loading
    if (!isLoading) {
      loadChessBoardDependencies();
    }
  }, [isLoading]);

  const loadChessBoardDependencies = () => {
    setIsLoading(true);

    const chessBoardCSSURL = new URL("../chessboard-1.0.0.min.css", import.meta.url).href;
    const chessboardJSURL = new URL("../chessboard-1.0.0.min.js", import.meta.url).href;
    const jqueryURL = new URL("../jquery-3.5.1.min.js", import.meta.url).href;

    // Create or get existing script tags
    let jqueryScriptTag = document.getElementById("jquery-script") as HTMLScriptElement;
    let chessboardJSScriptTag = document.getElementById("chessboard-js-script") as HTMLScriptElement;
    let chessboardCSSLinkTag = document.getElementById("chessboard-css-link") as HTMLLinkElement;

    // Create jQuery script tag if it doesn't exist
    if (!jqueryScriptTag) {
      jqueryScriptTag = document.createElement('script');
      jqueryScriptTag.id = 'jquery-script';
      jqueryScriptTag.type = 'text/javascript';
      document.head.appendChild(jqueryScriptTag);
    }

    // Create Chessboard.js script tag if it doesn't exist
    if (!chessboardJSScriptTag) {
      chessboardJSScriptTag = document.createElement('script');
      chessboardJSScriptTag.id = 'chessboard-js-script';
      chessboardJSScriptTag.type = 'text/javascript';
      document.head.appendChild(chessboardJSScriptTag);
    }

    // Create Chessboard CSS link tag if it doesn't exist
    if (!chessboardCSSLinkTag) {
      chessboardCSSLinkTag = document.createElement('link');
      chessboardCSSLinkTag.id = 'chessboard-css-link';
      chessboardCSSLinkTag.rel = 'stylesheet';
      chessboardCSSLinkTag.type = 'text/css';
      document.head.appendChild(chessboardCSSLinkTag);
    }

    // Set up loading chain
    jqueryScriptTag.onload = () => {
      loadChessboard();
    };

    chessboardJSScriptTag.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    jqueryScriptTag.onerror = () => {
      console.error('Failed to load jQuery');
      setIsLoading(false);
    };

    chessboardJSScriptTag.onerror = () => {
      console.error('Failed to load Chessboard.js');
      setIsLoading(false);
    };

    function loadChessboard() {
      chessboardJSScriptTag.src = chessboardJSURL;
      chessboardCSSLinkTag.href = chessBoardCSSURL;
    }

    // Start the loading chain
    jqueryScriptTag.src = jqueryURL;
  };

  // Don't render children until scripts are loaded
  if (!isLoaded) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading chess board dependencies...</div>
        {isLoading && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Please wait while jQuery and Chessboard.js load.
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ChessBoardLoader;