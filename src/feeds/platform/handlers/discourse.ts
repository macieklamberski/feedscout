import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const userRegex = /^\/u\/([^/]+)/
const categoryRegex = /^\/c\/([^/]+)/
const topicRegex = /^\/t\/([^/]+)\/(\d+)/

export const isDiscourseHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Discourse')
}

export const discourseHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isDiscourseHtml(content)) {
        return false
      }

      new URL(url)

      return true
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)

      const topicMatch = pathname.match(topicRegex)

      if (topicMatch?.[1] && topicMatch?.[2]) {
        return [
          {
            uri: `${origin}/t/${topicMatch[1]}/${topicMatch[2]}.rss`,
            hint: composeHint('discourse:topic'),
          },
        ]
      }

      const userMatch = pathname.match(userRegex)

      if (userMatch?.[1]) {
        return [
          {
            uri: `${origin}/u/${userMatch[1]}/activity.rss`,
            hint: composeHint('discourse:activity'),
          },
        ]
      }

      const categoryMatch = pathname.match(categoryRegex)

      if (categoryMatch?.[1]) {
        return [
          {
            uri: `${origin}/c/${categoryMatch[1]}.rss`,
            hint: composeHint('discourse:category'),
          },
        ]
      }

      return [
        {
          uri: `${origin}/latest.rss`,
          hint: composeHint('discourse:latest'),
        },
      ]
    } catch {}

    return []
  },
}
