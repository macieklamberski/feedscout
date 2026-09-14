import { isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers: blog, tag, tildePath.
// Handler needed for: userPath.

const usersPathRegex = /^\/(?:users\/|~)([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/

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
    const uris: Array<DiscoverUriEntry> = []

    let userOrigin = origin

    // www.dreamwidth.org/users/{user} or /~{user} — canonicalise to subdomain form.
    if (isHostOf(url, ['www.dreamwidth.org', 'dreamwidth.org'])) {
      const userMatch = pathname.match(usersPathRegex)

      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1]}.dreamwidth.org`
      } else {
        return uris
      }
    }

    // Tag-filtered feeds for /tag/{tag}.
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = encodeURIComponent(tagMatch[1])

      uris.push({
        uri: `${userOrigin}/data/rss?tag=${tag}`,
        hint: composeHint('dreamwidth:posts-tag-rss'),
      })
      uris.push({
        uri: `${userOrigin}/data/atom?tag=${tag}`,
        hint: composeHint('dreamwidth:posts-tag-atom'),
      })
    }

    uris.push({ uri: `${userOrigin}/data/rss`, hint: composeHint('dreamwidth:posts-rss') })
    uris.push({ uri: `${userOrigin}/data/atom`, hint: composeHint('dreamwidth:posts-atom') })
    uris.push({
      uri: `${userOrigin}/data/userpics`,
      hint: composeHint('dreamwidth:userpics-atom'),
    })

    return uris
  },
}
