# REZUSTAND

[![Build Status](https://img.shields.io/github/actions/workflow/status/lonelyhentai/rezustand/lint-and-type.yml?branch=main&style=flat&colorA=000000&colorB=000000)](https://github.com/lonelyhentai/rezustand/actions?query=workflow%3ALint)
[![Build Size](https://img.shields.io/bundlephobia/minzip/rezustand?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=rezustand)
[![Version](https://img.shields.io/npm/v/rezustand?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/rezustand)

A toolset making zustand easy to use!

## Installation

```shell
npm install rezustand
```

## Example

In `appStore.ts`:

```typescript
import { easyImmer, easyStoreContext } from './rezustand';
import type { EasyInferStoreTypes } from './rezustand';
import { createStore } from 'zustand/esm';

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

export type AppStoreTypes = EasyInferStoreTypes<typeof createAppStore>;

const {
  useContextStore: useAppStore,
  StoreContext: AppStoreContext,
  StoreProvider: AppStoreProvider,
} = easyStoreContext(createAppStore);

export { useAppStore, createAppStore, AppStoreContext, AppStoreProvider };
```

In `App.tsx`:

```tsx
import './styles.css';
import { AppStoreProvider, useAppStore } from './appStore';

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
```
