import type { PageServerLoad } from "./$types"
import { Omnivore } from '@omnivore-app/api'

const omnivore = new Omnivore({
  apiKey: import.meta.env.VITE_OMNIVORE_KEY,
  baseUrl: 'https://api-prod.omnivore.app/api/graphql'
})
export const load: PageServerLoad = async () => {
  const res = await omnivore.items.search({
    first: 100,
    format: "html",
    includeContent: true
  })

  const req = res.edges.flatMap((v) => v.node)
  return { search: req }
}

