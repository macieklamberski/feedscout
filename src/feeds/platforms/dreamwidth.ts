import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'
import { getJournalFeeds, journalTagRegex } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, tag, tildePath, userPath.

export type DreamwidthUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = ['dreamwidth.org']
const wwwHosts = ['www.dreamwidth.org', 'dreamwidth.org']
const usersPathRegex = /^\/(?:users\/|~)([^/]+)/i

export const parseDreamwidthUrl = (url: string): DreamwidthUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

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

  if (!getTenantSubdomain(url, domains)) {
    return
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
      ? getHostOrigin(`${parsed.username.replaceAll('_', '-')}.dreamwidth.org`)
      : new URL(url).origin

    if (!base) {
      return []
    }

    return getJournalFeeds(base, parsed.tag, 'dreamwidth')
  },
}
