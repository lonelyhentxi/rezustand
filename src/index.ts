import { createContext, createElement, useContext, useRef } from 'react';
import type { Context, PropsWithChildren, Provider } from 'react';
import type { Draft } from 'immer';
import { useStore } from 'zustand';
import type { Mutate, StoreApi, StoreMutatorIdentifier } from 'zustand';
import type {
  ExtractMutateMs,
  ExtractState,
  IsVoid,
  ReplaceMutateState,
  SetStateInternal,
} from './type-utils';

export type { ExtractState, ExtractMutateMs, ReplaceMutateState };

export function rezustandUnimplemented(): never {
  const error = Object.assign(new Error('rezustand unimplemented'), {
    code: 'ERR_REZUSTAND_UNIMPLEMENTED',
  });
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(error, rezustandUnimplemented);
  }
  throw error;
}

export type StoreEasySetStateType<T> = {
  (s: Partial<T> | T, shouldReplace?: boolean | undefined): T;
  // infer that can not return any value when use as draft<T>
  <R extends IsVoid<R>>(
    f: (s: Draft<T>) => R,
    shouldReplace?: boolean | undefined
  ): void;
};

export type StoreEasyCreateOptions<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  EXT = {},
  M extends Mutate<
    StoreApi<any>,
    [StoreMutatorIdentifier, unknown][]
  > = StoreApi<EXT & T>
> = {
  setup(): T;
  ext?: EXT;
} & ThisType<{
  get: () => Readonly<EXT & T>;
  set: StoreEasySetStateType<EXT & T>;
  api: ReplaceMutateState<EXT & T, M>;
  /**
   * @deprecated use `get`
   */
  methods: {
    readonly [key in keyof EXT as EXT[key] extends (...args: any[]) => any
    ? key
    : never]: EXT[key];
  } & {
    readonly [key in keyof T as T[key] extends (...args: any[]) => any
    ? key
    : never]: T[key];
  };
}>;

export function easyCreator<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  EXT = {},
  M extends Mutate<
    StoreApi<any>,
    [StoreMutatorIdentifier, unknown][]
  > = StoreApi<EXT & T>
>(createOptions: StoreEasyCreateOptions<T, EXT, M>) {
  return (set: any, get: any, api: any): T => {
    const obj = {
      get,
      set,
      api,
      /**
       * @deprecated use `get`
       */
      get methods() {
        return this.get();
      },
      setup() {
        return createOptions.setup.call(this);
      },
    };
    return obj.setup();
  };
}

export type NSSliceEasyCreateOptions<
  NS extends string,
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  EXT = {},
  M extends Mutate<
    StoreApi<T & { ext: EXT }>,
    [StoreMutatorIdentifier, unknown][]
  > = StoreApi<T & { ext: EXT }>
> = {
  ns: NS;
  ext?: EXT;
  setup(): T;
} & ThisType<{
  ns: NS;
  get: () => Readonly<T & { ext: EXT }>;
  set: StoreEasySetStateType<T>;
  api: ReplaceMutateState<T & { ext: EXT }, M> & {
    setState: SetStateInternal<T>;
  };
}>;

export function easyNSSliceCreator<
  NS extends string,
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  EXT = {},
  M extends Mutate<
    StoreApi<T & { ext: EXT }>,
    [StoreMutatorIdentifier, unknown][]
  > = StoreApi<T & { ext: EXT }>
>(createOptions: NSSliceEasyCreateOptions<NS, T, EXT, M>) {
  return (set: any, get: any, api: any): Record<NS, T> => {
    const ns = createOptions.ns;
    const obj = {
      ns,
      get(): any {
        const s = get();
        return {
          ns,
          ...(s[createOptions.ns] as any),
          ext: s,
        };
      },
      set(sOrF: Partial<T> | T | ((draft: Draft<T>) => any)): any {
        const ns = createOptions.ns as string;
        set((s: any) => {
          let next: any;
          if (typeof sOrF === 'function') {
            const sNs = s[ns] as any;
            // eslint-disable-next-line @typescript-eslint/ban-types
            (sOrF as Function)(sNs);
          } else {
            next = sOrF;
          }
          if (next?.ext !== undefined || next?.ns !== undefined) {
            console.error('can not set ext or ns to namespacing slice');
            delete next.ext;
            delete next.ns;
          }
          s[ns] = {
            ...s[ns],
            ...next,
          };
        });
      },
      get api(): any {
        const getState = (): any => {
          const state = api.getState();
          return {
            ext: state,
            ns,
            ...state[ns],
          };
        };
        return {
          getState,
          setState(n: any, r: any): any {
            const next = Object.assign({}, n);
            if (next?.ext !== undefined || next?.ns !== undefined) {
              console.error('can not set ext or ns to namespacing slice');
              delete next.ext;
              delete next.ns;
            }
            const state = api.getState();
            api.setState(
              {
                [ns]: {
                  ...state[ns],
                  ...next,
                },
              },
              r
            );
          },
          subscribe(listener: (state: T, prevState: T) => void): () => void {
            let prevState = getState();
            return api.subscribe(() => {
              const currState = getState();
              // before listener snapshot prevState, prevent listener throw error
              const prevStateSnapshot = prevState;
              prevState = currState
              listener(currState, prevStateSnapshot);
            });
          },
          destory() {
            rezustandUnimplemented();
          },
        };
      },
      setup() {
        return {
          [createOptions.ns]: createOptions.setup.call(this),
        };
      },
    };
    return obj.setup() as any;
  };
}

export function easyStoreProvider<
  P,
  S extends Mutate<StoreApi<any>, [StoreMutatorIdentifier, unknown][]>
>(createStore: (props: P) => S, context: Context<S | null>) {
  return function EasyStoreProvider(props: PropsWithChildren<P>) {
    const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createStore(props);
    }
    return createElement(
      context.Provider as any as Provider<S>,
      { value: storeRef.current as S },
      props.children
    );
  };
}

export function easyStoreContext<
  S extends Mutate<StoreApi<any>, [StoreMutatorIdentifier, unknown][]>,
  P
>(createStore: (props: P) => S) {
  type t = EasyInferStoreTypes<ReturnType<typeof createStore>>;
  const StoreContext = createContext<S | null>(null);

  const useContextStoreRef = (() => {
    const contextStore = useContext(StoreContext);
    if (!contextStore) {
      throw new Error(
        `there has no context store generated by ${createStore.name ?? createStore.toString()
        }`
      );
    }
    return contextStore;
  }) as t['UseContextStoreRefType'];

  const useContextStore = ((...args: any[]) => {
    const contextStore = useContextStoreRef();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return useStore(contextStore, ...args);
  }) as t['UseContextStoreType'];

  const StoreProvider = easyStoreProvider(createStore, StoreContext);

  return {
    useContextStore,
    useContextStoreRef,
    StoreContext,
    StoreProvider,
  };
}

export function storeApiSubscribeWithSelector<M extends StoreApi<any>, U>(
  api: M,
  selector: (state: ExtractState<M>) => U,
  listener: (selectedState: U, previousSelectedState: U) => void,
  options?: {
    equalityFn?: (a: U, b: U) => boolean;
    fireImmediately?: boolean;
  }
) {
  type S = ExtractState<M>;
  type Listener = (state: S, previousState: S) => void;
  const origSubscribe = api.subscribe as (listener: Listener) => () => void;
  const equalityFn = options?.equalityFn || Object.is;
  let currentSlice = selector(api.getState());
  const res = origSubscribe((c, _p) => {
    const nextSlice = selector(c);
    if (!equalityFn(currentSlice, nextSlice)) {
      const previousSlice = currentSlice;
      listener((currentSlice = nextSlice), previousSlice);
    }
  });
  if (options?.fireImmediately) {
    listener(currentSlice, currentSlice);
  }
  return res;
}

export type EasyInferStoreTypes<
  S extends Mutate<StoreApi<any>, [StoreMutatorIdentifier, unknown][]>
> = {
  StateType: ExtractState<S>;
  StoreType: S;
  ContextType: Context<S | null>;
  ProviderType: Provider<S>;
  UseContextStoreType: {
    (): ExtractState<S>;
    <U>(
      selector: (state: ExtractState<S>) => U,
      equals?: (a: U, b: U) => boolean
    ): U;
  };
  UseContextStoreRefType: {
    (): S;
  };
};

export type EasyInferNSSliceSelfStateType<R extends Record<any, any>> =
  R extends Record<any, infer T> ? T : never;

export type EasyInferNSSliceStateType<
  NS extends string,
  R extends Record<any, any>
> = Record<NS, EasyInferNSSliceSelfStateType<R>>;

export type EasyInferCreateSliceStateType<
  T extends (...args: any[]) => (...args: any[]) => any
> = ReturnType<ReturnType<T>>;
