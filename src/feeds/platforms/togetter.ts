import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type TogetterUrl = { kind: 'user'; username: string }

export const hosts = ['togetter.com', 'www.togetter.com']
const userPathRegex = /^\/id\/([^/]+)/i

export const parseTogetterUrl = (url: string): TogetterUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userPathRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const username = parseTogetterUrl(url)?.username
    const uris: Array<DiscoverUriEntry> = []

    if (username) {
      uris.push({
        uri: `${origin}/rss/id/${username}`,
        hint: composeHint('togetter:curator'),
      })
    }

    uris.push({ uri: `${origin}/rss/hot`, hint: composeHint('togetter:hot') })

    return uris
  },
}
