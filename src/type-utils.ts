import type {
  Mutate,
  StoreApi,
  StoreMutatorIdentifier,
  StoreMutators,
} from 'zustand';

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type IsVoid<X> = true extends Equal<X, void>
  ? void
  : true extends Equal<X, undefined>
  ? void
  : never;

export type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;

export type SetStateInternal<T> = {
  _(
    partial:
      | T
      | Partial<T>
      | {
          _(state: T): T | Partial<T>;
        }['_'],
    replace?: boolean | undefined
  ): void;
}['_'];

export type ExtractMutateMs<
  M extends Mutate<StoreApi<any>, [StoreMutatorIdentifier, unknown][]>
> = M extends StoreMutators<any, infer A> ? A : [];

export type ReplaceMutateState<
  T,
  M extends Mutate<StoreApi<any>, [StoreMutatorIdentifier, unknown][]>
> = Mutate<StoreApi<T>, ExtractMutateMs<M>>;
