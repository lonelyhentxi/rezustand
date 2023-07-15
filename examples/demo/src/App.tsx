import './styles.css';
import { useEffect } from 'react';
import { AppStoreProvider, useAppStore } from './appStore';

function ChildView() {
  const { a, incA, subscribeListChange, getListData } = useAppStore((s) => ({
    a: s.a,
    incA: s.incA,
    subscribeListChange: s.listA.subscribeListChange,
    getListData: s.listA.getListData,
  }));

  useEffect(() => {
    const unsub = subscribeListChange();
    getListData();
    return unsub;
  }, [subscribeListChange, getListData]);

  return (
    <>
      <h1>Hello CodeSandbox</h1>
      <h2>a: {a}</h2>
      <button onClick={() => incA()}>add a</button>
    </>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <div className="App">
        <ChildView />
      </div>
    </AppStoreProvider>
  );
}
