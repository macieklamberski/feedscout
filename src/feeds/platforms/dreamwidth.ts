import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'
import { getJournalName, journalTagRegex } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, tag, tildePath, userPath.

export type DreamwidthUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = ['dreamwidth.org']
const wwwHosts = ['www.dreamwidth.org', 'dreamwidth.org']

const usersPathRegex = /^\/(?:users\/|~)([^/]+)/i

const feeds = definePlatformFeeds([
  {
    key: 'dreamwidth:posts-tag',
    template: 'https://{journal}.dreamwidth.org/data/rss?tag={tag}',
    format: 'rss',
  },
  {
    key: 'dreamwidth:posts-tag',
    template: 'https://{journal}.dreamwidth.org/data/atom?tag={tag}',
    format: 'atom',
  },
  { key: 'dreamwidth:posts', template: 'https://{journal}.dreamwidth.org/data/rss', format: 'rss' },
  {
    key: 'dreamwidth:posts',
    template: 'https://{journal}.dreamwidth.org/data/atom',
    format: 'atom',
  },
  {
    key: 'dreamwidth:userpics',
    template: 'https://{journal}.dreamwidth.org/data/userpics',
    format: 'atom',
  },
])

export const parseDreamwidthUrl = (url: string): DreamwidthUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  const tag = pathname.match(journalTagRegex)?.[1]

  // Bare www.dreamwidth.org has no per-user context, so it names a journal only through a
  // /users/ or /~ selector in the path.
  if (isHostOf(url, wwwHosts)) {
    const username = getJournalName(pathname, usersPathRegex)

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
    const origin = parsed.username
      ? getHostOrigin(`${parsed.username.replaceAll('_', '-')}.dreamwidth.org`)
      : url

    if (!origin) {
      return []
    }

    const journal = getTenantSubdomain(origin, domains)

    if (!journal) {
      return []
    }

    const entries: Array<DiscoverUriEntry> = []

    if (parsed.tag) {
      const tag = decodeSegment(parsed.tag) ?? parsed.tag

      entries.push(feeds.getFeedEntry('dreamwidth:posts-tag', { journal, tag }, 'rss'))
      entries.push(feeds.getFeedEntry('dreamwidth:posts-tag', { journal, tag }, 'atom'))
    }

    entries.push(feeds.getFeedEntry('dreamwidth:posts', { journal }, 'rss'))
    entries.push(feeds.getFeedEntry('dreamwidth:posts', { journal }, 'atom'))
    entries.push(feeds.getFeedEntry('dreamwidth:userpics', { journal }, 'atom'))

    return entries
  },

  getFeedKey: feeds.getFeedKey,
}
