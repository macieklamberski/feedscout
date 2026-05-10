import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.
//
// LiveJournal serves per-user feeds at {user}.livejournal.com/data/{rss,atom,userpics},
// with optional ?tag={tag} filter. www.livejournal.com/users/{user} and /~{user} are
// alternate paths; users.livejournal.com/{user} and community.livejournal.com/{user}
// are legacy hosts. The handler canonicalises all of these to the subdomain form.

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/
const legacyUserPathRegex = /^\/([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/

const reservedHosts = new Set([
  'livejournal.com',
  'www.livejournal.com',
  'users.livejournal.com',
  'community.livejournal.com',
  'syndicated.livejournal.com',
])

export const livejournalHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'livejournal.com')) {
      return false
    }

    // Bare www/users/community/syndicated hosts have no per-user context and would
    // emit 404 URLs. Allow them only when a user selector is in the path.
    try {
      const { hostname, pathname } = new URL(url)

      if (reservedHosts.has(hostname.toLowerCase())) {
        if (hostname.toLowerCase() === 'www.livejournal.com') {
          return wwwUsersPathRegex.test(pathname)
        }

        if (
          hostname.toLowerCase() === 'users.livejournal.com' ||
          hostname.toLowerCase() === 'community.livejournal.com'
        ) {
          return legacyUserPathRegex.test(pathname)
        }

        return false
      }
    } catch {
      return false
    }

    return true
  },

  resolve: (url) => {
    const { origin, hostname, pathname } = new URL(url)
    const lowerHostname = hostname.toLowerCase()
    const uris: Array<DiscoverUriEntry> = []

    let userOrigin = origin

    // www.livejournal.com/users/{user} or /~{user} — canonicalise to subdomain form.
    if (lowerHostname === 'www.livejournal.com') {
      const userMatch = pathname.match(wwwUsersPathRegex)

      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1]}.livejournal.com`
      } else {
        return uris
      }
    }

    // Legacy users./community. hosts — first path segment is the user.
    if (
      lowerHostname === 'users.livejournal.com' ||
      lowerHostname === 'community.livejournal.com'
    ) {
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
      const tag = encodeURIComponent(tagMatch[1])

      uris.push({
        uri: `${userOrigin}/data/rss?tag=${tag}`,
        hint: composeHint('livejournal:posts-tag-rss'),
      })
      uris.push({
        uri: `${userOrigin}/data/atom?tag=${tag}`,
        hint: composeHint('livejournal:posts-tag-atom'),
      })
    }

    uris.push({ uri: `${userOrigin}/data/rss`, hint: composeHint('livejournal:posts-rss') })
    uris.push({ uri: `${userOrigin}/data/atom`, hint: composeHint('livejournal:posts-atom') })
    uris.push({
      uri: `${userOrigin}/data/userpics`,
      hint: composeHint('livejournal:userpics-atom'),
    })

    return uris
  },
}
