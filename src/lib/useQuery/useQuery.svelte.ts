// MIT License
// Copyright (c) 2023 One Law LLC
// https://github.com/vlcn-io/js/blob/main/packages/react/src/queryHooks.ts

//-------------------------------------------------------------
// import { RowID } from "./rowid.js";
export type Opaque<BaseType, BrandType = unknown> = BaseType & {
  readonly [Symbols.base]: BaseType;
  readonly [Symbols.brand]: BrandType;
};
namespace Symbols {
  export declare const base: unique symbol;
  export declare const brand: unique symbol;
}
export type RowID<T> = Opaque<bigint, T>;
//-------------------------------------------------------------

import type { TblRx } from "@vlcn.io/rx-tbl";
import type {
  DBAsync,
  StmtAsync,
  UpdateType,
  TXAsync,
  DB
} from "@vlcn.io/xplat-api";
import { UPDATE_TYPE } from '@vlcn.io/xplat-api'
export { first, firstPick, pick } from '@vlcn.io/xplat-api'

export type CtxAsync = {
  readonly db: DBAsync;
  readonly rx: TblRx;
};

export type Ctx = {
  readonly db: DB;
  readonly rx: TblRx;
};
export type QueryData<T> = {
  readonly loading: boolean;
  readonly error?: Error;
  readonly data: T;
};

const EMPTY_ARRAY: readonly any[] = Object.freeze([]);
const log = (...args: any) => { console.log(args) };
const allUpdateTypes = [
  UPDATE_TYPE.INSERT,
  UPDATE_TYPE.UPDATE,
  UPDATE_TYPE.DELETE,
];

export function useQuery<R, M = R[]>(
  ctx: CtxAsync,
  query: string,
  bindings?: any[],
  postProcess?: (rows: R[]) => M,
  updateTypes: UpdateType[] = allUpdateTypes,
  _rowid_?: RowID<R>
): QueryData<M> {
  let stateMachine = $state<AsyncResultStateMachine<R, M> | null>(new AsyncResultStateMachine(
    ctx,
    query,
    bindings,
    postProcess,
    updateTypes,
    _rowid_
  ))
  /* const lastCtx = $state<CtxAsync | null>(ctx);
  // A bunch of hoops to jump through to appease react strict mode
  if (stateMachine == null || lastCtx !== ctx) {
    lastCtx = ctx;
    if (stateMachine != null) {
      stateMachine.dispose();
    }
    stateMachine = new AsyncResultStateMachine(
      ctx,
      query,
      bindings,
      postProcess,
      updateTypes,
      _rowid_
    );
  } */

  let lastBindings = $state<unknown[] | undefined>();
  let lastQuery = $state<string | undefined>();
  if (!arraysShallowEqual(bindings, lastBindings)) {
    stateMachine?.respondToBindingsChange(bindings || EMPTY_ARRAY);
    lastBindings = bindings;
  }
  if (query !== lastQuery) {
    stateMachine?.respondToQueryChange(query);
    lastQuery = (query);
  }

  return {
    get data() { return stateMachine.getSnapshot() },
    destroy() {
      stateMachine?.dispose();
      stateMachine = null;
    }
  }
}

let pendingQuery: number | null = null;
let queryTxHolder: number | null = null;
let queryId = 0;
let txAcquisition: Promise<[() => void, TXAsync]> | null = null;

class AsyncResultStateMachine<T, M = readonly T[]> {
  #pendingFetchPromise: Promise<any> | null = null;
  #pendingPreparePromise: Promise<StmtAsync | null> | null = null;
  #stmt: StmtAsync | null = null;
  #queriedTables: string[] | null = null;
  #data: QueryData<M> | null = $state(null);
  #error?: QueryData<M> = $state();
  #disposed: boolean = false;
  #disposedState;
  get disposedState() { return this.#disposedState }
  #fetchingState;
  #dbSubscriptionDisposer: (() => void) | null;
  // So a query hook cannot overwhelm the DB, we fold all the queries
  // down and only execute the last one.
  #queuedFetch = false;
  #queuedFetchRebind = false;
  #ctx: CtxAsync
  #query: string
  #bindings: readonly any[] | undefined
  get bindings() { return this.#bindings }
  #postProcess?: (rows: T[]) => M
  #updateTypes: UpdateType[] = allUpdateTypes
  #_rowid_?: bigint

  constructor(
    ctx: CtxAsync,
    query: string,
    bindings: readonly any[] | undefined,
    postProcess?: (rows: T[]) => M,
    updateTypes: UpdateType[] = allUpdateTypes,
    _rowid_?: bigint
  ) {
    this.#ctx = ctx
    this.#query = query
    this.#bindings = bindings
    this.#postProcess = postProcess
    this.#updateTypes = updateTypes
    this.#_rowid_ = _rowid_
    this.#dbSubscriptionDisposer = null;
    this.#disposedState = {
      loading: false,
      data: this.#postProcess
        ? this.#postProcess(EMPTY_ARRAY as any)
        : (EMPTY_ARRAY as any),
      error: new Error("useAsyncQuery was disposed"),
    } as const;
    this.#fetchingState = {
      ...this.#disposedState,
      rawData: [] as any[],
      loading: true,
      error: undefined,
    };
  }

  disposeDbSubscription = () => {
    if (this.#dbSubscriptionDisposer) {
      this.#dbSubscriptionDisposer();
      this.#dbSubscriptionDisposer = null;
    }
  };

  // TODO: warn the user if query changes too much
  respondToQueryChange = (query: string): void => {
    if (this.#disposed) {
      return;
    }
    if (this.#query === query) {
      return;
    }
    this.#query = query;
    // cancel prep and fetch if in-flight
    this.#queuedFetch = this.#queuedFetch || this.#pendingFetchPromise != null;
    this.#pendingPreparePromise = null;
    this.#pendingFetchPromise = null;
    this.#queriedTables = null;
    this.#error = undefined;
    if (this.#data != null) {
      this.#fetchingState = {
        ...this.#data,
        loading: true,
      } as any;
    }
    this.#data = null;
    this.#pullData(true);
  };

  // TODO: warn the user if bindings change too much
  respondToBindingsChange = (bindings: readonly any[]): void => {
    if (this.#disposed) {
      return;
    }
    let i = 0;
    for (i = 0; i < bindings.length; ++i) {
      if (bindings[i] !== this.#bindings?.[i]) {
        break;
      }
    }
    if (i === bindings.length && i === this.#bindings?.length) {
      // no actual change
      return;
    }
    this.#bindings = bindings;
    // cancel fetch if in-flight. We do not need to re-prepare for binding changes.
    this.#queuedFetch = this.#queuedFetch || this.#pendingFetchPromise != null;
    if (this.#queuedFetch) {
      this.#queuedFetchRebind = true;
    }

    this.#pendingFetchPromise = null;
    this.#error = undefined;
    if (this.#data != null) {
      this.#fetchingState = {
        ...this.#data,
        loading: true,
      } as any;
    }
    this.#data = null;
    this.#pullData(true);
  };

  // TODO: the change event should be forwarded too.
  // So we can subscribe to adds vs deletes vs updates vs all
  #respondToDatabaseChange = (updates: UpdateType[]) => {
    if (this.#disposed) {
      this.disposeDbSubscription();
      return;
    }

    if (!updates.some((u) => this.#updateTypes.includes(u))) {
      return;
    }

    this.#queuedFetch = this.#queuedFetch || this.#pendingFetchPromise != null;
    this.#pendingFetchPromise = null;
    this.#error = undefined;
    if (this.#data != null) {
      this.#fetchingState = {
        ...this.#data,
        loading: true,
      } as any;
    }
    this.#data = null;
    this.#pullData(false);
  };

  /**
   * The entrypoint to the state machine.
   * Any time something happens (db change, query change, bindings change) we call back
   * into `getSnapshot` to compute what the new state should be.
   *
   * getSnapshot must be memoized and not re-issue queries if one is already in flight for
   * the current set of:
   * - query string
   * - bindings
   * - underlying db state
   */
  getSnapshot = (rebind: boolean = false): QueryData<M> => {
    log('rebind', rebind)
    log("get snapshot");
    if (this.#disposed) {
      log("disposed");
      return this.#disposedState;
    }
    if (this.#data != null) {
      log("data");
      return this.#data;
    }
    if (this.#error != null) {
      log("error");
      return this.#error;
    }

    this.#pullData(rebind);

    log("fetching");
    return this.#fetchingState;
  };

  #pullData(rebind: boolean) {
    if (this.#disposed) {
      return;
    }

    if (this.#queuedFetch) {
      return;
    }

    if (this.#pendingPreparePromise == null) {
      // start preparing the statement
      this.#prepare();
    }
    if (this.#pendingFetchPromise == null) {
      // start fetching the data
      this.#fetch(rebind);
    }
  }

  #prepare() {
    log("hooks - Preparing");
    this.#queriedTables = null;
    this.#error = undefined;
    this.#data = null;
    this.#pendingFetchPromise = null;
    if (this.#stmt) {
      this.#stmt.finalize(null);
    }
    this.#stmt = null;

    const preparePromise = this.#prepareAndGetUsedTables().then(
      ([stmt, queriedTables]) => {
        // Someone called in with a new query before we finished preparing the original query
        if (this.#pendingPreparePromise !== preparePromise) {
          stmt.finalize(null);
          return null;
        }

        this.#stmt = stmt;
        this.#queriedTables = queriedTables;
        this.disposeDbSubscription();
        if (this.#_rowid_ != null) {
          if (this.#queriedTables.length > 1) {
            console.warn("usePointQuery should only be used on a single table");
          }
          this.#dbSubscriptionDisposer = this.#ctx.rx.onPoint(
            this.#queriedTables[0],
            this.#_rowid_,
            this.#respondToDatabaseChange
          );
        } else {
          this.#dbSubscriptionDisposer = this.#ctx.rx.onRange(
            queriedTables,
            this.#respondToDatabaseChange
          );
        }
        return stmt;
      }
    );
    this.#pendingPreparePromise = preparePromise;
  }

  #fetch(rebind: boolean) {
    log("hooks - Fetching");
    if (this.#stmt == null) {
      rebind = true;
    }
    this.#error = undefined;
    this.#data = null;

    let fetchPromise: Promise<any> | null = null;

    const fetchInternal = () => {
      log("hooks - Fetching (internal)");
      if (fetchPromise != null && this.#pendingFetchPromise !== fetchPromise) {
        if (this.#queuedFetch) {
          this.#queuedFetch = false;
          this.#pullData(false);
        }
        return;
      }
      const stmt = this.#stmt;
      if (stmt == null) {
        return;
      }

      if (rebind || this.#queuedFetchRebind) {
        stmt.bind(this.#bindings || []);
        this.#queuedFetchRebind = false;
      }

      const doFetch = (releaser: () => void, tx: TXAsync) => {
        return stmt
          .raw(false)
          .all(tx)
          .then(
            (data) => {
              if (pendingQuery === myQueryId) {
                pendingQuery = null;
                txAcquisition = null;
                tx.exec("RELEASE use_query_" + queryTxHolder).then(
                  releaser,
                  releaser
                );
              }

              if (this.#pendingFetchPromise !== fetchPromise) {
                this.#queuedFetch = false;
                if (this.#pendingFetchPromise == null) {
                  this.#pullData(false);
                }
                return;
              }

              let newRawData = data;
              let newData;
              const oldRawData = this.#fetchingState?.rawData;
              if (dataShallowlyEqual(newRawData, oldRawData)) {
                newRawData = oldRawData;
                newData = this.#fetchingState?.data;
              } else {
                newData = this.#postProcess
                  ? this.#postProcess(newRawData)
                  : newRawData;
              }
              this.#data = {
                loading: false,
                data: newData,
                // @ts-ignore
                rawData: newRawData,
                error: undefined,
              };
              this.#pendingFetchPromise = null;

              if (this.#queuedFetch) {
                this.#queuedFetch = false;
                this.#pullData(false);
              }
            },
            (error: Error) => {
              if (pendingQuery === myQueryId) {
                pendingQuery = null;
                // rollback tx
                tx.exec("ROLLBACK").then(releaser, releaser);
              }
              this.#error = {
                loading: false,
                data:
                  this.#data?.data ||
                  ((this.#postProcess
                    ? this.#postProcess(EMPTY_ARRAY as any)
                    : EMPTY_ARRAY) as any),
                error,
              };
              this.#pendingFetchPromise = null;
              if (this.#queuedFetch) {
                this.#queuedFetch = false;
                this.#pullData(false);
              }
            }
          );
      };

      const myQueryId = ++queryId;
      const prevPending = pendingQuery;
      pendingQuery = myQueryId;
      if (prevPending == null) {
        queryTxHolder = myQueryId;
        // start tx
        txAcquisition = this.#ctx.db.imperativeTx().then((relAndTx) => {
          relAndTx[1].exec("SAVEPOINT use_query_" + queryTxHolder);
          return relAndTx;
        });
      }
      fetchPromise = txAcquisition!.then(([releaser, tx]) =>
        doFetch(releaser, tx)
      );

      this.#pendingFetchPromise = fetchPromise;
      return fetchPromise;
    };

    if (this.#stmt == null) {
      // chain after prepare promise
      fetchPromise = this.#pendingPreparePromise!.then((stmt) => {
        if (stmt == null) {
          return;
        }

        return fetchInternal();
      });
      this.#pendingFetchPromise = fetchPromise;
    } else {
      fetchInternal();
      return;
    }
  }

  #prepareAndGetUsedTables(): Promise<[StmtAsync, string[]]> {
    return Promise.all([
      this.#ctx.db.prepare(this.#query),
      usedTables(this.#ctx.db, this.#query),
    ]);
  }

  dispose() {
    this.#stmt?.finalize(null);
    this.#stmt = null;
    this.disposeDbSubscription();
    this.#disposed = true;
  }
}

function usedTables(db: DBAsync, query: string): Promise<string[]> {
  return db.tablesUsedStmt.all(null, query).then((rows) => {
    return rows.map((r) => r[0]);
  });
}

function dataShallowlyEqual(left: any, right: any): boolean {
  // Handle arrays of rows
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i] && !shallowEqual(left[i], right[i])) {
        return false;
      }
    }
    return true;
  }

  // Anything else
  return shallowEqual(left, right);
}

const is = Object.is;
const hasOwn = Object.prototype.hasOwnProperty;

export default function shallowEqual(objA: any, objB: any) {
  if (is(objA, objB)) return true;

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

function arraysShallowEqual(
  a: unknown[] | undefined,
  b: unknown[] | undefined
) {
  if (a == null || b == null) {
    return a === b;
  }

  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length && i < b.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
