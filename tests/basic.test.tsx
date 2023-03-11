import { afterEach, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react';
import { createStore } from 'zustand';
import { EasyInferStoreTypes, easyImmer, easyStoreContext } from 'rezustand';

const consoleError = console.error;
afterEach(() => {
  console.error = consoleError;
});

it('works with simple counter', async () => {
  const createAppStore = () =>
    createStore(
      easyImmer({
        setup() {
          return {
            a: 1,
            b: 2,
            incA: () => {
              const { a } = this.get();

              this.set((s) => void (s.a = a + 1));
            },
            getInitialProps: async () => {
              this.methods.incA();
            },
          };
        },
      })
    );

  type AppStoreTypes = EasyInferStoreTypes<typeof createAppStore>;

  const { useContextStore: useAppStore, StoreProvider: AppStoreProvider } =
    easyStoreContext(createAppStore);

  function ChildView() {
    const { a, incA } = useAppStore((s) => ({ a: s.a, incA: s.incA }));

    return (
      <>
        <h1>Hello CodeSandbox</h1>
        <h2>count: {a}</h2>
        <button onClick={() => incA()}>add a</button>
      </>
    );
  }

  function App() {
    return (
      <AppStoreProvider>
        <div className="App">
          <ChildView />
        </div>
      </AppStoreProvider>
    );
  }

  const { findByText, getByText } = render(
    <>
      <App />
    </>
  );
  await findByText('count: 1');

  fireEvent.click(getByText('add a'));

  expect(await findByText('count: 2')).toBeTruthy();
});
