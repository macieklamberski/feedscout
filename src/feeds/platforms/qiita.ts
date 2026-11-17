import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
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

const hosts = ['qiita.com', 'www.qiita.com']

const tagRegex = /^\/tags\/([^/]+)/i
const organizationRegex = /^\/organizations\/([^/]+)/i
const popularItemsRegex = /^\/popular-items(\/|$)/i
const officialColumnsRegex = /^\/official-columns(\/|$)/i

// Qiita serves the user, tag and popular feeds at `/feed.atom` too. The literal rows read before
// `/{username}/feed`, so a user named popular-items or official-columns reads as the site feed.
const feeds = definePlatformFeeds('qiita', [
  { key: 'zine', main: 'https://qiita.com/official-columns/feed/', format: 'rss' },
  { key: 'zine', main: 'https://qiita.com/official-columns/feed/atom/', format: 'atom' },
  {
    key: 'popular',
    main: 'https://qiita.com/popular-items/feed',
    aliases: ['https://qiita.com/popular-items/feed.atom'],
  },
  {
    key: 'organization',
    main: 'https://qiita.com/organizations/{organization}/activities.atom',
  },
  {
    key: 'tag',
    main: 'https://qiita.com/tags/{tag}/feed',
    aliases: ['https://qiita.com/tags/{tag}/feed.atom'],
  },
  {
    key: 'posts',
    main: 'https://qiita.com/{username}/feed',
    aliases: ['https://qiita.com/{username}/feed.atom'],
  },
])

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

  // The table reads any first segment as a username, and a route word is none:
  // qiita.com/tags/feed is the page of the tag feed.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key === 'qiita:posts' && parseQiitaUrl(url)?.kind !== 'user') {
      return
    }

    return hint
  },
}
