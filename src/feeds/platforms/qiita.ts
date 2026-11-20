import { qiita } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: organization, posts, tag.
// Handler needed for: popular, zine.

export type QiitaUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'organization'; organization: string }
  | { kind: 'popularItems' }
  | { kind: 'officialColumns' }
  | { kind: 'user'; username: string }

const hosts = qiita.hosts.exact

const tagRegex = /^\/tags\/([^/]+)/i
const organizationRegex = /^\/organizations\/([^/]+)/i
const popularItemsRegex = /^\/popular-items(\/|$)/i
const officialColumnsRegex = /^\/official-columns(\/|$)/i

const feeds = withHintLabels(qiita.feeds)

export const parseQiitaUrl = (url: string): QiitaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const organization = pathname.match(organizationRegex)?.[1]

  if (organization) {
    return { kind: 'organization', organization }
  }

  if (popularItemsRegex.test(pathname)) {
    return { kind: 'popularItems' }
  }

  // Qiita Zine.
  if (officialColumnsRegex.test(pathname)) {
    return { kind: 'officialColumns' }
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

export const qiitaHandler: PlatformHandler = {
  match: (url) => {
    return parseQiitaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseQiitaUrl(url)

    if (!parsed) {
      return []
    }

    // The popular items and Qiita Zine feeds need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tag: parsed.tag }),
        feeds.getFeedEntry('popular'),
        feeds.getFeedEntry('zine', {}, 'rss'),
        feeds.getFeedEntry('zine', {}, 'atom'),
      ]
    }

    if (parsed.kind === 'organization') {
      return [
        feeds.getFeedEntry('organization', { organization: parsed.organization }),
        feeds.getFeedEntry('popular'),
        feeds.getFeedEntry('zine', {}, 'rss'),
        feeds.getFeedEntry('zine', {}, 'atom'),
      ]
    }

    if (parsed.kind === 'popularItems') {
      return [
        feeds.getFeedEntry('popular'),
        feeds.getFeedEntry('zine', {}, 'rss'),
        feeds.getFeedEntry('zine', {}, 'atom'),
      ]
    }

    if (parsed.kind === 'officialColumns') {
      return [
        feeds.getFeedEntry('zine', {}, 'rss'),
        feeds.getFeedEntry('zine', {}, 'atom'),
        feeds.getFeedEntry('popular'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', { username: parsed.username }),
      feeds.getFeedEntry('popular'),
      feeds.getFeedEntry('zine', {}, 'rss'),
      feeds.getFeedEntry('zine', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
