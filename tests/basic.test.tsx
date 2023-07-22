import { useEffect } from 'react';
import { afterEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  EasyInferCreateSliceStateType,
  EasyInferNSSliceStateType,
  EasyInferStoreTypes,
  easyCreator,
  easyNSSliceCreator,
  easyStoreContext,
  storeApiSubscribeWithSelector,
} from 'rezustand';

const consoleError = console.error;
afterEach(() => {
  console.error = consoleError;
});

it('works with simple counter', async () => {
  const consoleSpy = jest.spyOn(console, 'log');

  const InitProps = {
    a: 1,
    b: 2,
  };
  const createAppSlice = () => {
    return easyCreator({
      setup() {
        return {
          ...InitProps,
          incA: () => {
            const { a } = this.get();

            this.set((s) => void (s.a = a + 1));
          },
          getInitialProps: async () => {
            this.get().incA();
          },
          testApi: () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const api = this.api;
          },
        };
      },
    });
  };

  const createListSlice = <NS extends string>(
    ns: NS,
    initProps: typeof InitProps
  ) => {
    return easyNSSliceCreator({
      ns,
      ext: initProps,
      setup() {
        return {
          listData: [] as number[],
          getListData: () => {
            const prevS = this.get();
            const prevList = prevS.listData;
            this.set((s) => {
              s.listData = [...prevList, prevS.ext.a];
            });
          },
          testApi: () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const api = this.api;
            // can not set ext
            // api.setState({
            //   ext: {},
            // });
          },
          subscribeListChange: () => {
            storeApiSubscribeWithSelector(
              this.api,
              (s) => s.listData,
              (listData) => {
                console.log(`${this.ns} list data changed`, listData);
              },
              {
                fireImmediately: true,
              }
            );
          },
        };
      },
    });
  };

  type AppState = EasyInferCreateSliceStateType<typeof createAppSlice> &
    EasyInferNSSliceStateType<
      'listA',
      EasyInferCreateSliceStateType<typeof createListSlice>
    >;

  const createAppStore = () =>
    createStore<AppState>()(
      immer((set, get, api) => ({
        ...createAppSlice()(set, get, api),
        ...createListSlice('listA', InitProps)(set, get, api),
      }))
    );

  type AppStoreTypes = EasyInferStoreTypes<ReturnType<typeof createAppStore>>;

  const {
    useContextStore: useAppStore,
    StoreContext: AppStoreContext,
    StoreProvider: AppStoreProvider,
  } = easyStoreContext(createAppStore);

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
  expect(consoleSpy).toHaveBeenCalledTimes(2);
  expect(consoleSpy.mock.calls[0]).toEqual(['listA list data changed', []]);
  expect(consoleSpy.mock.calls[1]).toEqual(['listA list data changed', [1]]);
  consoleSpy.mockRestore();
});
