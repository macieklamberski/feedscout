import { isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, decodePathSegment } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, community, tag, tildePath, userPath, usersHost.

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/
const legacyUserPathRegex = /^\/([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/

const legacyUserHosts = ['users.livejournal.com', 'community.livejournal.com']
const reservedHosts = [
  'livejournal.com',
  'www.livejournal.com',
  'users.livejournal.com',
  'community.livejournal.com',
  'syndicated.livejournal.com',
]

export const livejournalHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'livejournal.com')) {
      return false
    }

    // Bare www/users/community/syndicated hosts have no per-user context and would
    // emit 404 URLs. Allow them only when a user selector is in the path.
    const { pathname } = new URL(url)

    if (isHostOf(url, reservedHosts)) {
      if (isHostOf(url, 'www.livejournal.com')) {
        return wwwUsersPathRegex.test(pathname)
      }

      if (isHostOf(url, legacyUserHosts)) {
        return legacyUserPathRegex.test(pathname)
      }

      return false
    }

    return true
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    let userOrigin = origin

    // www.livejournal.com/users/{user} or /~{user} — canonicalise to subdomain form.
    if (isHostOf(url, 'www.livejournal.com')) {
      const userMatch = pathname.match(wwwUsersPathRegex)

      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1]}.livejournal.com`
      } else {
        return uris
      }
    }

    // Legacy users./community. hosts — first path segment is the user.
    if (isHostOf(url, legacyUserHosts)) {
      const userMatch = pathname.match(legacyUserPathRegex)

      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1]}.livejournal.com`
      } else {
        return uris
      }
    }

    // Tag-filtered feeds for /tag/{tag}.
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = encodeURIComponent(decodePathSegment(tagMatch[1]))

      uris.push({
        uri: `${userOrigin}/data/rss?tag=${tag}`,
        hint: composeHint('livejournal:posts-tag', 'rss'),
      })
      uris.push({
        uri: `${userOrigin}/data/atom?tag=${tag}`,
        hint: composeHint('livejournal:posts-tag', 'atom'),
      })
    }

    uris.push({ uri: `${userOrigin}/data/rss`, hint: composeHint('livejournal:posts', 'rss') })
    uris.push({ uri: `${userOrigin}/data/atom`, hint: composeHint('livejournal:posts', 'atom') })
    uris.push({
      uri: `${userOrigin}/data/userpics`,
      hint: composeHint('livejournal:userpics', 'atom'),
    })

    return uris
  },
}
