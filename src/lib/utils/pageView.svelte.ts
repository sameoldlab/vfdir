import { VIEWS } from "$lib/stores.svelte"

const Pv = () => {
  if (!localStorage.getItem('pageview'))
    localStorage.setItem('pageview', VIEWS[0])
  let val: VIEWS = $state(localStorage.getItem('pageview'))
  return {
    get v() {
      return val
    },
    set v(newVal: VIEWS) {
      localStorage.setItem('pageview', newVal)
      val = localStorage.getItem('pageview')
    }
  }
}
export const pageview = Pv()
