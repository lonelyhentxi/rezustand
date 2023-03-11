import { AppStoreProvider, useAppStore } from "./appStore";

function ChildView() {
  const { a, incA } = useAppStore((s) => ({ a: s.a, incA: s.incA }));

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
