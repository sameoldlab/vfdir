export const ssr = false
import type { PageLoad } from "./$types"

export const load: PageLoad = ({ params }) => {
  if (!document) return {}
  import("$lib/services/arena/arenav2").then(({ getBlocks }) => {
    console.log('echo', params)
    getBlocks(params.channel)
  })
  return {}
}
