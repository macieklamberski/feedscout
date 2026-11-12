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

const feeds = definePlatformFeeds(
  [
    {
      key: 'dreamwidth:posts-tag',
      template: '{scheme}://{host}/data/rss?tag={tag}',
      format: 'rss',
    },
    {
      key: 'dreamwidth:posts-tag',
      template: '{scheme}://{host}/data/atom?tag={tag}',
      format: 'atom',
    },
    { key: 'dreamwidth:posts', template: '{scheme}://{host}/data/rss', format: 'rss' },
    {
      key: 'dreamwidth:posts',
      template: '{scheme}://{host}/data/atom',
      format: 'atom',
    },
    {
      key: 'dreamwidth:userpics',
      template: '{scheme}://{host}/data/userpics',
      format: 'atom',
    },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
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

    // A journal named in the path lives on its own host, a journal page serves from its own.
    const host = parsed.username ? `${journal}.dreamwidth.org` : undefined
    const entries: Array<DiscoverUriEntry> = []

    if (parsed.tag) {
      const tag = decodeSegment(parsed.tag) ?? parsed.tag

      entries.push(page.getFeedEntry('dreamwidth:posts-tag', { host, tag }, 'rss'))
      entries.push(page.getFeedEntry('dreamwidth:posts-tag', { host, tag }, 'atom'))
    }

    entries.push(page.getFeedEntry('dreamwidth:posts', { host }, 'rss'))
    entries.push(page.getFeedEntry('dreamwidth:posts', { host }, 'atom'))
    entries.push(page.getFeedEntry('dreamwidth:userpics', { host }, 'atom'))

    return entries
  },

  getFeedHint: feeds.getFeedHint,
}
