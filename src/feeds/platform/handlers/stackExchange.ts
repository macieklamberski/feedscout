import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

// Partially discoverable without handler.

const tagRegex = /^\/questions\/tagged\/([\w.+-]+)/
const questionRegex = /^\/questions\/(\d+)/
const userRegex = /^\/users\/(\d+)/
const collectiveRegex = /^\/collectives\/([^/]+)/

// Standalone domains from SE API: https://api.stackexchange.com/2.3/sites
const domains = [
  'stackoverflow.com',
  'serverfault.com',
  'superuser.com',
  'askubuntu.com',
  'stackapps.com',
  'mathoverflow.net',
  'stackexchange.com',
]

// Sort values accepted by feeds.tag. Documented at api.stackexchange.com.
const validSorts = new Set(['newest', 'active', 'votes', 'creation', 'hot', 'week', 'month'])

const getSortSuffix = (searchParams: URLSearchParams): string => {
  const sort = searchParams.get('sort') ?? searchParams.get('tab')?.toLowerCase()

  if (sort && validSorts.has(sort)) {
    return `?sort=${sort}`
  }

  return ''
}

export const stackExchangeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, domains) || isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname, searchParams } = new URL(url)

    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/tag/${tagMatch[1]}${getSortSuffix(searchParams)}`,
          hint: composeHint('stackexchange:tag'),
        },
      ]
    }

    const questionMatch = pathname.match(questionRegex)

    if (questionMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/question/${questionMatch[1]}`,
          hint: composeHint('stackexchange:question'),
        },
      ]
    }

    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/user/${userMatch[1]}`,
          hint: composeHint('stackexchange:user'),
        },
      ]
    }

    const collectiveMatch = pathname.match(collectiveRegex)

    if (collectiveMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/collectives/${collectiveMatch[1]}`,
          hint: composeHint('stackexchange:collective'),
        },
      ]
    }

    // Homepage: site-wide newest questions feed.
    if (pathname === '/' || pathname === '') {
      return [
        {
          uri: `${origin}/feeds`,
          hint: composeHint('stackexchange:newest'),
        },
      ]
    }

    return []
  },
}
