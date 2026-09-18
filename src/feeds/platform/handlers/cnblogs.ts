import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A Cnblogs blog serves its feed at `/{user}/rss`.
//
// The response says `application/rss+xml` while the document is Atom, and the
// body opens with a UTF-8 byte order mark before the XML declaration.

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
    try {
      const { origin } = new URL(url)
      const username = getUsername(url)

      if (!username) {
        return []
      }

      return [{ uri: `${origin}/${username}/rss`, hint: composeHint('cnblogs:posts') }]
    } catch {}

    return []
  },
}
