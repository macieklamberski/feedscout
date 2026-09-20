import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// LiveJournal serves per-user RSS and Atom at
// `{user}.livejournal.com/data/{rss,atom}` (plus `/data/userpics` Atom and
// `?tag={tag}` filtering); only the base RSS+Atom are advertised via HTML
// `<link rel="alternate">`. Alternate paths `www.livejournal.com/users/{u}`,
// `/~{u}`, and legacy hosts `users.livejournal.com/{u}` /
// `community.livejournal.com/{u}` all resolve to the same per-user data.
// The handler adds tag and userpics feeds and canonicalises the alternates.

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
    const { hostname, pathname } = new URL(url)
    const lower = hostname.toLowerCase()

    if (reservedHosts.has(lower)) {
      if (lower === 'www.livejournal.com') {
        return wwwUsersPathRegex.test(pathname)
      }

      if (lower === 'users.livejournal.com' || lower === 'community.livejournal.com') {
        return legacyUserPathRegex.test(pathname)
      }

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
