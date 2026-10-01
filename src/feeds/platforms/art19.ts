import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type Art19Url = { kind: 'show'; slug: string }

const hosts = ['art19.com', 'www.art19.com']
const showPathRegex = /^\/shows\/([^/]+)/i

export const parseArt19Url = (url: string): Art19Url | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const slug = new URL(url).pathname.match(showPathRegex)?.[1]

  if (!slug) {
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
