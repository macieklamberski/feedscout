import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['cnblogs.com', 'www.cnblogs.com']
const excludedPaths = ['news', 'aggsite', 'question', 'ing', 'search', 'kb', 'sitehome', 'util']

const getUsername = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  if (!first || isAnyOf(first, excludedPaths)) {
    return
  }

  return first
}

export const cnblogsHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && Boolean(getUsername(url))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl
    const username = getUsername(url)

    if (!username) {
      return []
    }

    return [{ uri: `${origin}/${username}/rss`, hint: composeHint('cnblogs:posts') }]
  },
}
