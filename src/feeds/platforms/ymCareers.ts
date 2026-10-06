import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Unmeasured, rate limit: the board refuses an IP after about 15 requests, and one measurement sends about 200.

const searchPathRegex = /^\/jobs\/?$/i
// A browse page names one or more filters as key and value pairs, then an optional page number.
const browsePathRegex = /^\/jobs((?:\/[a-z_]+\/[^/]+)+?)(?:\/page\d+)?\/?$/i

const excludedParams = ['display', 'page']

export type YmCareersUrl =
  | { kind: 'search'; path: string; query: string }
  | { kind: 'browse'; facets: string; query: string }

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
    .filter((pair) => pair !== '' && !excludedParams.includes(pair.split('=')[0]))
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
    const { origin } = new URL(url)
    const parsed = parseYmCareersUrl(url)
    const query = parsed?.query ? `&${parsed.query}` : ''

    if (parsed?.kind === 'browse') {
      return [
        {
          uri: `${origin}/jobs${parsed.facets}?display=rss${query}`,
          hint: composeHint('ym-careers:browse'),
        },
      ]
    }

    return [
      {
        uri: `${origin}${parsed?.path ?? '/jobs'}?display=rss${query}`,
        hint: composeHint('ym-careers:search'),
      },
    ]
  },
}
