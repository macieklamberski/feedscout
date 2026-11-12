import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type PinboardUrl =
  | { kind: 'userTag'; username: string; tags: Array<string> }
  | { kind: 'user'; username: string }
  | { kind: 'tag'; tags: Array<string> }
  | { kind: 'recent' }
  | { kind: 'popular' }

const hosts = ['pinboard.in', 'www.pinboard.in']
const feedHosts = ['feeds.pinboard.in']

const userRegex = /^u:(.+)$/i
const tagRegex = /^t:(.+)$/i
const recentRegex = /^\/recent\/?$/i
const tagFeedRegex = /^\/rss\/(?:u:[^/]+\/)?t:[^/]+(?:\/t:[^/]+)*\/?$/i

const feeds = definePlatformFeeds([
  { key: 'pinboard:bookmarks', template: 'https://feeds.pinboard.in/rss/u:{username}/' },
  { key: 'pinboard:recent', template: 'https://feeds.pinboard.in/rss/recent/' },
  { key: 'pinboard:popular', template: 'https://feeds.pinboard.in/rss/popular/' },
])

const composeTagPath = (tags: Array<string>): string => {
  return tags.map((tag) => `t:${tag}/`).join('')
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

    for (const segment of rest) {
      const tag = tagRegex.exec(segment)?.[1]

      if (tag) {
        tags.push(tag)
      }
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
        {
          uri: `https://feeds.pinboard.in/rss/u:${parsed.username}/${composeTagPath(parsed.tags)}`,
          hint: composeHint('pinboard:tag'),
        },
      ]
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('pinboard:bookmarks', { username: parsed.username })]
    }

    // It answered 500 on 2026-09-26 while Pinboard's search backend was down, and validation
    // drops it until the backend is back.
    if (parsed.kind === 'tag') {
      return [
        {
          uri: `https://feeds.pinboard.in/rss/${composeTagPath(parsed.tags)}`,
          hint: composeHint('pinboard:tag'),
        },
      ]
    }

    if (parsed.kind === 'recent') {
      return [feeds.getFeedEntry('pinboard:recent')]
    }

    return [feeds.getFeedEntry('pinboard:popular')]
  },

  getFeedKey: (url) => {
    const key = feeds.getFeedKey(url)

    if (key) {
      return key
    }

    const parsedUrl = parseUrl(url)

    // A tag feed carries any number of tag segments, which a template segment cannot hold.
    if (parsedUrl && isHostOf(parsedUrl, feedHosts) && tagFeedRegex.test(parsedUrl.pathname)) {
      return 'pinboard:tag'
    }
  },
}
