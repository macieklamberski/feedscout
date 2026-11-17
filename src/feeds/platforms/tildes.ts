import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: group, tag.
// Handler needed for: topics.

export type TildesUrl =
  | { kind: 'group'; group: string; tag?: string }
  | { kind: 'home'; tag?: string }

const hosts = ['tildes.net', 'www.tildes.net']

const groupRegex = /^\/~([^/]+)/

// Tildes' feed views honour the ?tag= query (forces order=NEW server-side).
const feeds = definePlatformFeeds('tildes', [
  {
    key: 'group-tag',
    main: 'https://tildes.net/~{group}/topics.rss?tag={tag}',
    format: 'rss',
  },
  {
    key: 'group-tag',
    main: 'https://tildes.net/~{group}/topics.atom?tag={tag}',
    format: 'atom',
  },
  { key: 'group', main: 'https://tildes.net/~{group}/topics.rss', format: 'rss' },
  { key: 'group', main: 'https://tildes.net/~{group}/topics.atom', format: 'atom' },
  { key: 'tag', main: 'https://tildes.net/topics.rss?tag={tag}', format: 'rss' },
  { key: 'tag', main: 'https://tildes.net/topics.atom?tag={tag}', format: 'atom' },
  { key: 'topics', main: 'https://tildes.net/topics.rss', format: 'rss' },
  { key: 'topics', main: 'https://tildes.net/topics.atom', format: 'atom' },
])

export const parseTildesUrl = (url: string): TildesUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const tag = getQueryParam(searchParams, 'tag')
  const group = pathname.match(groupRegex)?.[1]

  if (group) {
    return { kind: 'group', group, tag }
  }

  return { kind: 'home', tag }
}

export const tildesHandler: PlatformHandler = {
  match: (url) => {
    return parseTildesUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTildesUrl(url)

    if (!parsed) {
      return []
    }

    const { tag } = parsed

    // The site-wide topics feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'group') {
      const { group } = parsed

      if (tag) {
        return [
          feeds.getFeedEntry('group-tag', { group, tag }, 'rss'),
          feeds.getFeedEntry('group-tag', { group, tag }, 'atom'),
          feeds.getFeedEntry('topics', {}, 'rss'),
          feeds.getFeedEntry('topics', {}, 'atom'),
        ]
      }

      return [
        feeds.getFeedEntry('group', { group }, 'rss'),
        feeds.getFeedEntry('group', { group }, 'atom'),
        feeds.getFeedEntry('topics', {}, 'rss'),
        feeds.getFeedEntry('topics', {}, 'atom'),
      ]
    }

    if (tag) {
      return [
        feeds.getFeedEntry('tag', { tag }, 'rss'),
        feeds.getFeedEntry('tag', { tag }, 'atom'),
        feeds.getFeedEntry('topics', {}, 'rss'),
        feeds.getFeedEntry('topics', {}, 'atom'),
      ]
    }

    return [feeds.getFeedEntry('topics', {}, 'rss'), feeds.getFeedEntry('topics', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
