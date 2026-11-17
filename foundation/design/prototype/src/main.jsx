import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

// 确保 html/body/#root 撑满视口，全屏布局依赖此 reset
const style = document.createElement('style');
style.textContent = '*, *::before, *::after { box-sizing: border-box; } html, body { height: 100%; margin: 0; padding: 0; } #root { height: 100%; display: flex; flex-direction: column; }';
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
