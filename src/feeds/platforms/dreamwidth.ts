import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJournalFeeds } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, tag, tildePath, userPath.

const usersPathRegex = /^\/(?:users\/|~)([^/]+)/

export const dreamwidthHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'dreamwidth.org')) {
      return false
    }

    // www.dreamwidth.org only matches when the path carries a /users/ or /~ user
    // selector — bare apex/www has no per-user context and would emit a 404 URL.
    if (isHostOf(url, ['www.dreamwidth.org', 'dreamwidth.org'])) {
      return usersPathRegex.test(new URL(url).pathname)
    }

    return true
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    let userOrigin = origin

    // www.dreamwidth.org/users/{user} or /~{user} — canonicalise to subdomain form.
    if (isHostOf(url, ['www.dreamwidth.org', 'dreamwidth.org'])) {
      const userMatch = pathname.match(usersPathRegex)

      // A username with `_` is served on a hostname with `-`.
      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1].replaceAll('_', '-')}.dreamwidth.org`
      } else {
        return []
      }
    }

    return getJournalFeeds(userOrigin, pathname, 'dreamwidth')
  },
}
