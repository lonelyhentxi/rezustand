export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

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
