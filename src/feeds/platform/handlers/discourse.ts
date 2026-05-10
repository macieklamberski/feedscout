import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const userRegex = /^\/u\/([^/]+)/
const categoryRegex = /^\/c\/([^/]+)/
const topicRegex = /^\/t\/([^/]+)\/(\d+)/
const topRegex = /^\/top(?:\/([^/]+))?\/?$/

const validTopPeriods = new Set(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all'])

const getTopPeriodSuffix = (
  pathPeriod: string | undefined,
  searchParams: URLSearchParams,
): string => {
  const period = pathPeriod ?? searchParams.get('period') ?? undefined

  if (period && validTopPeriods.has(period)) {
    return `?period=${period}`
  }

  return ''
}

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
      const { origin, pathname, searchParams } = new URL(url)

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

      // Top topics: /top or /top/{period}
      const topMatch = pathname.match(topRegex)

      if (topMatch) {
        const periodSuffix = getTopPeriodSuffix(topMatch[1], searchParams)

        return [
          {
            uri: `${origin}/top.rss${periodSuffix}`,
            hint: composeHint('discourse:top'),
          },
        ]
      }

      // Site root or unmatched path: latest topics + latest posts.
      const uris: Array<DiscoverUriEntry> = []

      uris.push({
        uri: `${origin}/latest.rss`,
        hint: composeHint('discourse:latest'),
      })
      uris.push({
        uri: `${origin}/posts.rss`,
        hint: composeHint('discourse:posts'),
      })

      return uris
    } catch {}

    return []
  },
}
