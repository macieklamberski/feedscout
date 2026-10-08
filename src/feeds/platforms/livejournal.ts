import { decodeSegment, isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, community, tag, tildePath, userPath, usersHost.

export type LivejournalUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = ['livejournal.com']
const wwwHosts = ['www.livejournal.com']
const legacyUserHosts = ['users.livejournal.com', 'community.livejournal.com']
const excludedHosts = [
  'livejournal.com',
  'www.livejournal.com',
  'users.livejournal.com',
  'community.livejournal.com',
  'syndicated.livejournal.com',
]

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/i
const legacyUserPathRegex = /^\/([^/]+)/
export const journalTagRegex = /^\/tag\/([^/]+)/i

// Dreamwidth and InsaneJournal run the LiveJournal engine, so a journal on any of them serves
// the same feeds, plus a tag's feeds on a tag page.
export const getJournalFeeds = (
  base: string,
  tag: string | undefined,
  platform: string,
): Array<DiscoverUriEntry> => {
  const uris: Array<DiscoverUriEntry> = []

  if (tag) {
    const encodedTag = encodeURIComponent(decodeSegment(tag) ?? tag)

    uris.push({
      uri: `${base}/data/rss?tag=${encodedTag}`,
      hint: composeHint(`${platform}:posts-tag`, 'rss'),
    })
    uris.push({
      uri: `${base}/data/atom?tag=${encodedTag}`,
      hint: composeHint(`${platform}:posts-tag`, 'atom'),
    })
  }

  uris.push({ uri: `${base}/data/rss`, hint: composeHint(`${platform}:posts`, 'rss') })
  uris.push({ uri: `${base}/data/atom`, hint: composeHint(`${platform}:posts`, 'atom') })
  uris.push({ uri: `${base}/data/userpics`, hint: composeHint(`${platform}:userpics`, 'atom') })

  return uris
}

export const parseLivejournalUrl = (url: string): LivejournalUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(journalTagRegex)?.[1]

  // Bare www/users/community/syndicated hosts have no per-user context and would
  // emit 404 URLs. Allow them only when a user selector is in the path.
  if (isHostOf(url, wwwHosts)) {
    const username = pathname.match(wwwUsersPathRegex)?.[1]

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag }
  }

  // Legacy users./community. hosts: the first path segment is the user.
  if (isHostOf(url, legacyUserHosts)) {
    const username = pathname.match(legacyUserPathRegex)?.[1]

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag }
  }

  if (isHostOf(url, excludedHosts)) {
    return
  }

  return { kind: 'journal', tag }
}

export const livejournalHandler: PlatformHandler = {
  match: (url) => {
    return parseLivejournalUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLivejournalUrl(url)

    if (!parsed) {
      return []
    }

    // A user named in the path is canonicalised to its subdomain.
    const base = parsed.username
      ? `https://${parsed.username}.livejournal.com`
      : new URL(url).origin

    return getJournalFeeds(base, parsed.tag, 'livejournal')
  },
}
