import { easyImmer, easyStoreContext } from "rezustand";
import { createStore } from "zustand";

const createAppStore = () =>
  createStore(
    easyImmer({
      setup() {
        return {
          a: 1,
          b: 2,
          incA: () => {
            const { a } = this.get();

            this.set((s) => {
              s.a = a + 1
            });
          },
          getInitialProps: async () => {},
          prepareClientData: async () => {
            this.methods.incA();
          }
        };
      }
    })
  );

const {
  useContextStore: useAppStore,
  StoreContext: AppStoreContext,
  StoreProvider: AppStoreProvider
} = easyStoreContext(createAppStore);

export { useAppStore, createAppStore, AppStoreContext, AppStoreProvider };
