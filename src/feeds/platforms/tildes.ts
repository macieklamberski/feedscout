import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type TildesUrl =
  | { kind: 'group'; group: string; tag?: string }
  | { kind: 'home'; tag?: string }

const hosts = ['tildes.net', 'www.tildes.net']

const groupRegex = /^\/~([^/]+)/

// Tildes' feed views honour the ?tag= query (forces order=NEW server-side).
const feeds = definePlatformFeeds([
  {
    key: 'tildes:group-tag',
    template: 'https://tildes.net/~{group}/topics.rss?tag={tag}',
    format: 'rss',
  },
  {
    key: 'tildes:group-tag',
    template: 'https://tildes.net/~{group}/topics.atom?tag={tag}',
    format: 'atom',
  },
  { key: 'tildes:group', template: 'https://tildes.net/~{group}/topics.rss', format: 'rss' },
  { key: 'tildes:group', template: 'https://tildes.net/~{group}/topics.atom', format: 'atom' },
  { key: 'tildes:tag', template: 'https://tildes.net/topics.rss?tag={tag}', format: 'rss' },
  { key: 'tildes:tag', template: 'https://tildes.net/topics.atom?tag={tag}', format: 'atom' },
  { key: 'tildes:topics', template: 'https://tildes.net/topics.rss', format: 'rss' },
  { key: 'tildes:topics', template: 'https://tildes.net/topics.atom', format: 'atom' },
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

    if (parsed.kind === 'group') {
      const { group } = parsed

      if (tag) {
        return [
          feeds.getFeedEntry('tildes:group-tag', { group, tag }, 'rss'),
          feeds.getFeedEntry('tildes:group-tag', { group, tag }, 'atom'),
        ]
      }

      return [
        feeds.getFeedEntry('tildes:group', { group }, 'rss'),
        feeds.getFeedEntry('tildes:group', { group }, 'atom'),
      ]
    }

    if (tag) {
      return [
        feeds.getFeedEntry('tildes:tag', { tag }, 'rss'),
        feeds.getFeedEntry('tildes:tag', { tag }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('tildes:topics', {}, 'rss'),
      feeds.getFeedEntry('tildes:topics', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
