// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { syncLocalData } from './lib/syncLocalData';
import './index.css';

syncLocalData()
  .then(({ collectionFixed, historyFixed }) => {
    if (collectionFixed > 0 || historyFixed > 0) {
      console.log(
        `[数据同步] 卡库修正 ${collectionFixed} 张，历史修正 ${historyFixed} 张`
      );
    }
  })
  .catch(err => {
    console.warn('数据同步失败（不影响使用）:', err);
  })
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });