import { writable, type Writable } from "svelte/store";
import { getContext, setContext } from "svelte";
import type { NavigationTarget } from "@sveltejs/kit";
export const ssr = false

export const VIEWS = ['block', 'miller', 'table', 'canvas'] as const
export type VIEWS = typeof VIEWS[number]

type TreeNode = NavigationTarget
export const getTree = () => getContext<Writable<TreeNode[]>>('history')
export const setTree = () => {
  const tree = writable([])
  setContext('history', tree)
}

