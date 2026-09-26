import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['pinboard.in', 'www.pinboard.in']

const userRegex = /^u:(.+)$/i
const tagRegex = /^t:(.+)$/i
const recentRegex = /^\/recent\/?$/i

export const pinboardHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const [first, ...rest] = getPathSegments(url)
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
        const tagPath = tags.map((tag) => `t:${tag}/`).join('')

        return [
          {
            uri: `https://feeds.pinboard.in/rss/u:${username}/${tagPath}`,
            hint: composeHint('pinboard:tag'),
          },
        ]
      }

      return [
        {
          uri: `https://feeds.pinboard.in/rss/u:${username}/`,
          hint: composeHint('pinboard:bookmarks'),
        },
      ]
    }

    // Site-wide tag feed: /t:{tag}/. It answered 500 on 2026-09-26 while Pinboard's search
    // backend was down, and validation drops it until the backend is back.
    const siteTags = [first, ...rest].map((segment) => segment?.match(tagRegex)?.[1])

    if (siteTags.length > 0 && siteTags.every(Boolean)) {
      const tagPath = siteTags.map((tag) => `t:${tag}/`).join('')

      return [
        {
          uri: `https://feeds.pinboard.in/rss/${tagPath}`,
          hint: composeHint('pinboard:tag'),
        },
      ]
    }

    if (recentRegex.test(pathname)) {
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
