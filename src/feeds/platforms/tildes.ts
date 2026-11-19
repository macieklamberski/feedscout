import { tildes } from 'feedintel'
import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: group, tag.
// Handler needed for: topics.

export type TildesUrl =
  | { kind: 'group'; group: string; tag?: string }
  | { kind: 'home'; tag?: string }

const hosts = tildes.hosts.exact

const groupRegex = /^\/~([^/]+)/

const feeds = withHintLabels(tildes.feeds)

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
