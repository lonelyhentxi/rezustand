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
        haha: () => {
          const api = this.api;
          const state = api.getState();
          console.log(`haha + ${state.a}`);
        },
        incA: () => {
          const { a } = this.get();

          this.set((s) => void (s.a = a + 1));
        },
        getInitialProps: async () => {
          this.methods.incA();
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

export type AppStoreTypes = EasyInferStoreTypes<
  ReturnType<typeof createAppStore>
>;

const {
  useContextStore: useAppStore,
  StoreContext: AppStoreContext,
  StoreProvider: AppStoreProvider,
} = easyStoreContext(createAppStore);

export { useAppStore, createAppStore, AppStoreContext, AppStoreProvider };
