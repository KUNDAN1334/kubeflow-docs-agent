import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global CSS reset + base styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }
  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background-color: #FAFAFA;
    color: #212121;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #root {
    display: flex;
    flex-direction: column;
  }
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #E0E0E0;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #BDBDBD;
  }
  textarea:focus {
    outline: none;
  }
  a {
    color: #1976D2;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
