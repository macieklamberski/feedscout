import { decodeSegment, isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, community, tag, tildePath, userPath, usersHost.

const domains = ['livejournal.com']
const wwwHosts = ['www.livejournal.com']
const legacyUserHosts = ['users.livejournal.com', 'community.livejournal.com']
const reservedHosts = [
  'livejournal.com',
  'www.livejournal.com',
  'users.livejournal.com',
  'community.livejournal.com',
  'syndicated.livejournal.com',
]

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/
const legacyUserPathRegex = /^\/([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/

// Dreamwidth and InsaneJournal run the LiveJournal engine, so a journal on any of them serves
// the same feeds, plus a tag's feeds on a tag page.
export const getJournalFeeds = (
  base: string,
  pathname: string,
  platform: string,
): Array<DiscoverUriEntry> => {
  const uris: Array<DiscoverUriEntry> = []
  const tagMatch = pathname.match(tagRegex)

  if (tagMatch?.[1]) {
    const tag = encodeURIComponent(decodeSegment(tagMatch[1]) ?? tagMatch[1])

    uris.push({
      uri: `${base}/data/rss?tag=${tag}`,
      hint: composeHint(`${platform}:posts-tag`, 'rss'),
    })
    uris.push({
      uri: `${base}/data/atom?tag=${tag}`,
      hint: composeHint(`${platform}:posts-tag`, 'atom'),
    })
  }

  uris.push({ uri: `${base}/data/rss`, hint: composeHint(`${platform}:posts`, 'rss') })
  uris.push({ uri: `${base}/data/atom`, hint: composeHint(`${platform}:posts`, 'atom') })
  uris.push({ uri: `${base}/data/userpics`, hint: composeHint(`${platform}:userpics`, 'atom') })

  return uris
}

export const livejournalHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, domains)) {
      return false
    }

    // Bare www/users/community/syndicated hosts have no per-user context and would
    // emit 404 URLs. Allow them only when a user selector is in the path.
    const { pathname } = new URL(url)

    if (isHostOf(url, reservedHosts)) {
      if (isHostOf(url, wwwHosts)) {
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

    let userOrigin = origin

    // www.livejournal.com/users/{user} or /~{user} — canonicalise to subdomain form.
    if (isHostOf(url, wwwHosts)) {
      const userMatch = pathname.match(wwwUsersPathRegex)

      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1]}.livejournal.com`
      } else {
        return []
      }
    }

    // Legacy users./community. hosts — first path segment is the user.
    if (isHostOf(url, legacyUserHosts)) {
      const userMatch = pathname.match(legacyUserPathRegex)

      if (userMatch?.[1]) {
        userOrigin = `https://${userMatch[1]}.livejournal.com`
      } else {
        return []
      }
    }

    return getJournalFeeds(userOrigin, pathname, 'livejournal')
  },
}
