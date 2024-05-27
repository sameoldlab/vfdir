/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface Platform {}
	// interface Session {}
	// interface Stuff {}
}

declare module '@sqlite.org/sqlite-wasm' {
	type TODO = any
	
	/**
	 * A function to be called when the SQLite3 module and worker APIs
	 * are done loading asynchronously. This is the only way of knowing
	 * that the loading has completed. 
	 * @since v3.46:
	 * Is passed the function which gets returned by `sqlite3Worker1Promiser()`,
	 * as accessing it from this callback is more convenient for certain usage
	 * patterns. The promiser v2 interface obviates the need for this callback.
	 */
	type OnreadyFunction = () => void

	export type Sqlite3Worker1PromiserConfig = {
		onready: OnreadyFunction
		/**
		 * A worker instance which loads `sqlite3-worker1.js`, or a functional
		 * equivalent. Note that the promiser factory replaces the `worker.onmessage`
		 * property. This config option may alternately be a function, in which
		 * case this function is called to instantiate the worker.
		 */
		worker?: Worker | (() => Worker)
		/** Function to generate unique message IDs  */
		generateMessageId?: (messageObject: TODO) => string
		/** A `console.debug()` style function for logging
		 * information about Worker messages.
		 * */
		debug?: (...args: any[]) => void
		/**
		 * A callback function that is called when a `message` event is
		 * received from the worker, and the event is not handled by the proxy.
		 *
		 * @note This *should* ideally never happen, as the proxy aims to handle
		 * all known message types.
		 */
		onunhandled?: (event: MessageEvent) => void
	}

	// TODO: update `Promiser` to use correct types from Promiser Methods

	// Message types and their corresponding arguments and results
	type OpenMessage = { filename: string }
	type OpenResult = { dbId: number }
	type CloseMessage = { dbId?: number }
	type CloseResult = void
	type ConfigGetMessage = void
	type ConfigGetResult = { [key: string]: TODO }
	type ExecMessage = {
		sql: string
		dbId?: number
		callback?: (row: TODO, rowNumber: number, columnNames: string[]) => void
	}
	type ExecResult = { [key: string]: TODO }
	
	type PromiserResponse = {
		type: string;
		result: TODO;
		// possibly other metadata ...
	}

	/** Function returned by sqlite3Worker1Promiser */
	type Promiser = {
		(messageType: string, messageArguments: TODO): Promise<PromiserResponse>
		(message: { type: string; args: TODO }): Promise<PromiserResponse>
	}

	/** Factory for creating promiser instances. */
	export const sqlite3Worker1Promiser: {
		/**
		 * Promiser v1
		 * @example
		 * const factory = sqlite3Worker1Promiser({
		 * onready: () => {
		 *     promiser("open", { filename: "my_database.sqlite" })
		 *       .then((msg) => {
		 *         // ...
		 *       })
		 *       .catch((e) => {
		 *         console.error(e)
		 *       })
		 *   }
		 * })
		 *  @link https://sqlite.org/wasm/doc/trunk/api-worker1.md#promiser
		 */
		(config?: Sqlite3Worker1PromiserConfig | OnreadyFunction): Promiser

		/**
		 * Promiser v2
		 * @since 3.46:
		 * @example
		 * const factoryPromise = sqlite3Worker1Promiser.v2(config);
		 * const factory = await factoryPromise;
		 *
		 * @link https://sqlite.org/wasm/doc/trunk/api-worker1.md#promiser.v2
		 */
		v2: (
			config?: Sqlite3Worker1PromiserConfig | OnreadyFunction
		) => Promise<Promiser>
		defaultConfig: Sqlite3Worker1PromiserConfig
	}
}
