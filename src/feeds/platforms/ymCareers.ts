import { ymCareers } from 'feedintel'
import { isAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Unmeasured, rate limit: the board refuses an IP after about 15 requests, and one measurement sends about 200.

export type YmCareersUrl =
  | { kind: 'search'; path: string; query: string }
  | { kind: 'browse'; facets: string; query: string }

const searchPathRegex = /^\/jobs\/?$/i
// A browse page names one or more filters as key and value pairs, then an optional page number.
const browsePathRegex = /^\/jobs((?:\/[a-z_]+\/[^/]+)+?)(?:\/page\d+)?\/?$/i

const excludedParams = ['display', 'page']

const feeds = withHintLabels(ymCareers.feeds)

// Every board answers with the header, its bot check page included.
export const isYmCareersHeaders = (headers: Headers): boolean => {
  return headers.has('x-nas-sid')
}

export const parseYmCareersUrl = (url: string): YmCareersUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // The raw pieces keep the page's own encoding, such as `%20` over `+`.
  const query = parsedUrl.search
    .slice(1)
    .split('&')
    .filter((pair) => pair && !isAnyOf(pair.split('=')[0], excludedParams))
    .join('&')

  if (searchPathRegex.test(parsedUrl.pathname)) {
    const path = parsedUrl.pathname.endsWith('/') ? '/jobs/' : '/jobs'

    return { kind: 'search', path, query }
  }

  const facets = parsedUrl.pathname.match(browsePathRegex)?.[1]

  if (facets) {
    return { kind: 'browse', facets, query }
  }

  // A job, the browse index and any other page fall back to the whole board.
  return { kind: 'search', path: '/jobs', query: '' }
}

export const ymCareersHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isYmCareersHeaders })) {
      return false
    }

    return parseYmCareersUrl(url) !== undefined
  },

  resolve: (url) => {
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    const { origin } = new URL(url)
    const parsed = parseYmCareersUrl(url)
    const query = parsed?.query ?? ''

    if (parsed?.kind === 'browse') {
      const root = `${origin}/jobs${parsed.facets}`

      return [pageFeeds.getFeedEntry('browse', { root, query })]
    }

    // The table drops one trailing slash from a root, so a search path ending in one keeps it.
    const root = `${origin}${parsed?.path ?? '/jobs'}/`

    return [pageFeeds.getFeedEntry('search', { root, query })]
  },
}
