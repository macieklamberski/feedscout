import { getPathSegments, isHostOf, parseUrl } from 'trousse'
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

const userRegex = /^u:(.+)$/i
const tagRegex = /^t:(.+)$/i
const recentRegex = /^\/recent\/?$/i

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
      const tag = segment.match(tagRegex)?.[1]

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
      return [
        {
          uri: `https://feeds.pinboard.in/rss/u:${parsed.username}/`,
          hint: composeHint('pinboard:bookmarks'),
        },
      ]
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
      return [
        {
          uri: 'https://feeds.pinboard.in/rss/recent/',
          hint: composeHint('pinboard:recent'),
        },
      ]
    }

    return [
      {
        uri: 'https://feeds.pinboard.in/rss/popular/',
        hint: composeHint('pinboard:popular'),
      },
    ]
  },
}
