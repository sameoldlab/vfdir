import { writable } from "svelte/store";

export const VIEWS = ['block', 'miller', 'table', 'canvas'] as const
export const view = writable<(typeof VIEWS)[number]>(VIEWS[0])
