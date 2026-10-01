import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type TogetterUrl = { kind: 'user'; username: string } | { kind: 'home' }

export const hosts = ['togetter.com', 'www.togetter.com']
const userPathRegex = /^\/id\/([^/]+)/i

export const parseTogetterUrl = (url: string): TogetterUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userPathRegex)?.[1]

  if (!username) {
    return { kind: 'home' }
  }

  return { kind: 'user', username }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return parseTogetterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTogetterUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const hot: DiscoverUriEntry = { uri: `${origin}/rss/hot`, hint: composeHint('togetter:hot') }

    if (parsed.kind === 'user') {
      return [
        { uri: `${origin}/rss/id/${parsed.username}`, hint: composeHint('togetter:curator') },
        hot,
      ]
    }

    return [hot]
  },
}
