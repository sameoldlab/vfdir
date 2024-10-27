/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope
import { build, files, version } from '$service-worker'
// Create a unique cache name for this deployment
const CACHE = `cache-${version}`
const ORIGIN = 'https://localhost:5461'
const ASSETS = [
  ...build, // the app itself
  ...files  // everything in `static`
]

// Initialization
sw.oninstall = (event) => {
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    console.log({ msg: 'adding files to cache', CACHE, ASSETS })
    const cache = await caches.open(CACHE)
    await cache.addAll(ASSETS)
  }

  event.waitUntil(addFilesToCache())
}

sw.onactivate = (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    console.log({ msg: 'deleting old cache', caches })
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key)
    }
  }

  event.waitUntil(deleteOldCaches())
}

// Intercept requests 
sw.onfetch = (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.startsWith('chrome-extension')) return

  async function respond() {
    const url = new URL(event.request.url)
    const cache = await caches.open(CACHE)
    let sameOrigin = url.origin === ORIGIN

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname)

      if (response) {
        return response
      }
    }

    // for everything else, try the network first, but
    // fall back to the cache if we're offline
    try {
      const response = await fetch(event.request)
      // if we're offline, fetch can return a value that is not a Response
      // instead of throwing - and we can't pass this non-Response to respondWith
      if (!(response instanceof Response)) {
        throw new Error('invalid response from fetch')
      }

      if (response.status === 200) {
        // I can handle extrernal blob cache in opfs so there is no need to duplicate it here
        if (sameOrigin) cache.put(event.request, response.clone())
      }

      return response
    } catch (err) {
      const response = await cache.match(event.request)

      if (response) {
        return response
      }

      // if there's no cache, then just error out
      // as there is nothing we can do to respond to this request
      throw err
    }
  }

  event.respondWith(respond())
}
