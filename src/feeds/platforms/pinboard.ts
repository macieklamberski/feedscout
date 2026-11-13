import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type PinboardUrl =
  | { kind: 'userTag'; username: string; tags: Array<string> }
  | { kind: 'userSource'; username: string; tags: Array<string>; source: string }
  | { kind: 'user'; username: string }
  | { kind: 'tag'; tags: Array<string> }
  | { kind: 'recent' }
  | { kind: 'popular' }

const hosts = ['pinboard.in', 'www.pinboard.in']

const userRegex = /^u:(.+)$/i
const tagRegex = /^t:(.+)$/i
const sourceRegex = /^from:(.+)$/i
const recentRegex = /^\/recent\/?$/i

const feeds = definePlatformFeeds([
  { key: 'pinboard:bookmarks', template: 'https://feeds.pinboard.in/rss/u:{username}/' },
  // A private feed, whose token only its owner knows, so it is claimed and never built.
  {
    key: 'pinboard:bookmarks',
    template: 'https://feeds.pinboard.in/rss/secret:{token}/u:{username}/',
  },
  { key: 'pinboard:recent', template: 'https://feeds.pinboard.in/rss/recent/' },
  { key: 'pinboard:popular', template: 'https://feeds.pinboard.in/rss/popular/' },
  // Bookmarks saved from one source, as `from:twitter`, with or without tags. The row with tags
  // comes first, so a page with tags builds it.
  {
    key: 'pinboard:source',
    template: 'https://feeds.pinboard.in/rss/u:{username}/t:{tags*}/from:{source}/',
  },
  { key: 'pinboard:source', template: 'https://feeds.pinboard.in/rss/u:{username}/from:{source}/' },
  // A tag feed repeats `t:{tag}` once per tag, so `tags` holds them joined by `/t:`. These rows go
  // after the source rows their paths overlap.
  { key: 'pinboard:tag', template: 'https://feeds.pinboard.in/rss/u:{username}/t:{tags*}/' },
  {
    key: 'pinboard:tag',
    template: 'https://feeds.pinboard.in/rss/secret:{token}/u:{username}/t:{tags*}/',
  },
  { key: 'pinboard:tag', template: 'https://feeds.pinboard.in/rss/t:{tags*}/' },
  // The network and starred feeds exist only as private feeds.
  {
    key: 'pinboard:network',
    template: 'https://feeds.pinboard.in/rss/secret:{token}/u:{username}/network/',
  },
  {
    key: 'pinboard:starred',
    template: 'https://feeds.pinboard.in/rss/secret:{token}/u:{username}/starred/',
  },
])

const joinTags = (tags: Array<string>): string => {
  return tags.join('/t:')
}

export const parsePinboardUrl = (url: string): PinboardUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [first, ...rest] = getPathSegments(parsedUrl)
  const username = first?.match(userRegex)?.[1]

  // User bookmarks, narrowed by one or more tags: /u:{user}/t:{tag}/t:{tag}/.
  if (username) {
    const tags: Array<string> = []
    let source: string | undefined

    for (const segment of rest) {
      const tag = tagRegex.exec(segment)?.[1]

      if (tag) {
        tags.push(tag)
      }

      source = sourceRegex.exec(segment)?.[1] ?? source
    }

    if (source) {
      return { kind: 'userSource', username, tags, source }
    }

    if (tags.length > 0) {
      return { kind: 'userTag', username, tags }
    }

    return { kind: 'user', username }
  }

  // Site-wide tag page: /t:{tag}/, where every segment is a tag.
  const siteTags = [first, ...rest].map((segment) => segment?.match(tagRegex)?.[1])

  if (siteTags.length > 0 && siteTags.every(Boolean)) {
    return { kind: 'tag', tags: siteTags.filter((tag) => tag !== undefined) }
  }

  if (recentRegex.test(parsedUrl.pathname)) {
    return { kind: 'recent' }
  }

  return { kind: 'popular' }
}

export const pinboardHandler: PlatformHandler = {
  match: (url) => {
    return parsePinboardUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePinboardUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'userTag') {
      return [
        feeds.getFeedEntry('pinboard:tag', {
          username: parsed.username,
          tags: joinTags(parsed.tags),
        }),
      ]
    }

    if (parsed.kind === 'userSource') {
      return [
        feeds.getFeedEntry('pinboard:source', {
          username: parsed.username,
          tags: joinTags(parsed.tags),
          source: parsed.source,
        }),
      ]
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('pinboard:bookmarks', { username: parsed.username })]
    }

    // It answered 500 on 2026-09-26 while Pinboard's search backend was down, and validation
    // drops it until the backend is back.
    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('pinboard:tag', { tags: joinTags(parsed.tags) })]
    }

    if (parsed.kind === 'recent') {
      return [feeds.getFeedEntry('pinboard:recent')]
    }

    return [feeds.getFeedEntry('pinboard:popular')]
  },

  getFeedHint: feeds.getFeedHint,
}
