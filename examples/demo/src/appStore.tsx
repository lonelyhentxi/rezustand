import {
  easyCreator,
  easyNSSliceCreator,
  easyStoreContext,
  storeApiSubscribeWithSelector,
} from 'rezustand';
import type {
  EasyInferCreateSliceStateType,
  EasyInferNSSliceStateType,
  EasyInferStoreTypes,
} from 'rezustand';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

type AppSliceState = EasyInferCreateSliceStateType<typeof createAppSlice>;

const createExtSlice = (ext: AppSliceState) => {
  return easyCreator({
    setup() {
      return {
        extIncB: () => {
          const { b } = this.get();

          this.set((s) => void (s.b = b + 1));
        }
      };
    },
    ext,
  });
};

type ExtSliceState = EasyInferCreateSliceStateType<typeof createExtSlice>

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

type ListSliceState = EasyInferNSSliceStateType<
'listA',
  EasyInferCreateSliceStateType<typeof createListSlice>
>;

type AppState = 
  AppSliceState &
  ExtSliceState &
  ListSliceState;

const createAppStore = () =>
  createStore<AppState>()(
    immer((set, get, api) => {
      const appSlice = createAppSlice()(set, get, api);
      return {
        ...appSlice,
        ...createExtSlice(appSlice)(set, get, api),
        ...createListSlice('listA', InitProps)(set, get, api),
      }
    })
  );

const {
  useContextStore: useAppStore,
  StoreContext: AppStoreContext,
  StoreProvider: AppStoreProvider,
} = easyStoreContext(createAppStore);

export { useAppStore, createAppStore, AppStoreContext, AppStoreProvider };
