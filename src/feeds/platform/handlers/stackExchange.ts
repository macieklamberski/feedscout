import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Stack Exchange sites (stackoverflow.com and the per-site subdomains
// listed in the SE API) expose Atom feeds under `/feeds`, `/feeds/tag/{tag}`,
// `/feeds/question/{id}`, `/feeds/user/{id}`, and
// `/feeds/collectives/{name}`, and most browser pages autodiscover the
// matching feed via `<link rel="alternate" type="application/atom+xml">`.
// The handler maps every supported URL shape directly to its feed and
// passes through the `?sort=`/`?tab=` tag-feed sort parameter (whitelisted
// to values the endpoint actually honors).

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
