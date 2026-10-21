import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type Art19Url = { kind: 'show'; slug: string }

const hosts = ['art19.com', 'www.art19.com']
const showPathRegex = /^\/shows\/([^/]+)/i
// length: keeps a show uuid out
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const parseArt19Url = (url: string): Art19Url | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const slug = new URL(url).pathname.match(showPathRegex)?.[1]

  // A show page also answers under the show's uuid, and rss.art19.com serves a feed only under the
  // slug, which the page alone names.
  if (!slug || uuidRegex.test(slug)) {
    return
  }

  return { kind: 'show', slug }
}

export const art19Handler: PlatformHandler = {
  match: (url) => {
    return parseArt19Url(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArt19Url(url)

    if (!parsed) {
      return []
    }

    return [{ uri: `https://rss.art19.com/${parsed.slug}`, hint: composeHint('art19:show') }]
  },
}
