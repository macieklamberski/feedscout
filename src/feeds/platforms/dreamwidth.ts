import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'
import { getJournalName, getJournalTag } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts, posts-tag.
// Handler needed for: userpics.

export type DreamwidthUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = ['dreamwidth.org']
const wwwHosts = ['www.dreamwidth.org', 'dreamwidth.org']

const usersPathRegex = /^\/(?:users\/|~)([^/]+)/i

const feeds = definePlatformFeeds(
  'dreamwidth',
  [
    { key: 'posts-tag', main: '{scheme}://{host}/data/rss?tag={tag}', format: 'rss' },
    { key: 'posts-tag', main: '{scheme}://{host}/data/atom?tag={tag}', format: 'atom' },
    { key: 'posts', main: '{scheme}://{host}/data/rss', format: 'rss' },
    { key: 'posts', main: '{scheme}://{host}/data/atom', format: 'atom' },
    { key: 'userpics', main: '{scheme}://{host}/data/userpics', format: 'atom' },
  ],
  { hosts: { tenants: domains } },
)

export const parseDreamwidthUrl = (url: string): DreamwidthUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  // Bare www.dreamwidth.org has no per-user context, so it names a journal only through a
  // /users/ or /~ selector in the path.
  if (isHostOf(url, wwwHosts)) {
    const username = getJournalName(pathname, usersPathRegex)

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag: getJournalTag(pathname, usersPathRegex) }
  }

  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'journal', tag: getJournalTag(pathname) }
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

    if (parsed.tag) {
      const tag = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        page.getFeedEntry('posts-tag', { host, tag }, 'rss'),
        page.getFeedEntry('posts-tag', { host, tag }, 'atom'),
        page.getFeedEntry('posts', { host }, 'rss'),
        page.getFeedEntry('posts', { host }, 'atom'),
        page.getFeedEntry('userpics', { host }, 'atom'),
      ]
    }

    return [
      page.getFeedEntry('posts', { host }, 'rss'),
      page.getFeedEntry('posts', { host }, 'atom'),
      page.getFeedEntry('userpics', { host }, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
