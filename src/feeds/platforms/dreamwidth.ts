import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJournalFeeds, journalTagRegex } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic covers tildePath (html), partly covers blog, tag, userPath.

export type DreamwidthUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = ['dreamwidth.org']
const wwwHosts = ['www.dreamwidth.org', 'dreamwidth.org']
const usersPathRegex = /^\/(?:users\/|~)([^/]+)/i

export const parseDreamwidthUrl = (url: string): DreamwidthUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(journalTagRegex)?.[1]

  // Bare www.dreamwidth.org has no per-user context, so it names a journal only through a
  // /users/ or /~ selector in the path.
  if (isHostOf(url, wwwHosts)) {
    const username = pathname.match(usersPathRegex)?.[1]

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag }
  }

  return { kind: 'journal', tag }
}

export const dreamwidthHandler: PlatformHandler = {
  match: (url) => {
    return parseDreamwidthUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDreamwidthUrl(url)

    if (!parsed) {
      return []
    }

    // A username with `_` is served on a hostname with `-`.
    const base = parsed.username
      ? `https://${parsed.username.replaceAll('_', '-')}.dreamwidth.org`
      : new URL(url).origin

    return getJournalFeeds(base, parsed.tag, 'dreamwidth')
  },
}
