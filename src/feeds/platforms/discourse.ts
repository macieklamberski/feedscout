import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers category, home, top (html).
// Handler needed for: user.

const userRegex = /^\/u\/([^/]+)/
const categoryRegex = /^\/c\/(.+?)\/?$/
const topicRegex = /^\/t\/([^/]+)\/(\d+)/
const topRegex = /^\/top(?:\/([^/]+))?\/?$/

const validTopPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all']

const getTopPeriodSuffix = (
  pathPeriod: string | undefined,
  searchParams: URLSearchParams,
): string => {
  const period = pathPeriod ?? searchParams.get('period') ?? undefined

  if (period && validTopPeriods.includes(period)) {
    return `?period=${period}`
  }

  return ''
}

export const isDiscourseHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Discourse') ||
    content.includes('id="data-discourse-setup"')
  )
}

export const isDiscourseHeaders = (headers: Headers): boolean => {
  return headers.has('x-discourse-route')
}

export const discourseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseUrl(url)) {
      return false
    }

    if (content && isDiscourseHtml(content)) {
      return true
    }

    if (headers && isDiscourseHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
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
  },
}
