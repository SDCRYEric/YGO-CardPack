// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CardPreviewProvider } from './components/CardPreviewProvider';
import { syncLocalData } from './lib/syncLocalData';
import './index.css';

// 启动时同步一次 localStorage 数据
syncLocalData().then(({ collectionFixed, historyFixed }) => {
  if (collectionFixed > 0 || historyFixed > 0) {
    console.log(
      `[数据同步] 卡库修正 ${collectionFixed} 张，历史修正 ${historyFixed} 张`
    );
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CardPreviewProvider>
      <App />
    </CardPreviewProvider>
  </React.StrictMode>
);