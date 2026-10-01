import { isHostOrSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, meta, question (html).
// Handler needed for: collective, otherSite, tagged, user.

export type StackExchangeUrl =
  | { kind: 'tag'; tag: string; sort?: string }
  | { kind: 'question'; questionId: string }
  | { kind: 'user'; userId: string }
  | { kind: 'collective'; collective: string }
  | { kind: 'home' }

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

const tagRegex = /^\/questions\/tagged\/([\w.+-]+)/i
const questionRegex = /^\/questions\/(\d+)/i
const userRegex = /^\/users\/(\d+)/i
const collectiveRegex = /^\/collectives\/([^/]+)/i

// Sort values accepted by feeds.tag. Documented at api.stackexchange.com.
const validSorts = ['newest', 'active', 'votes', 'creation', 'hot', 'week', 'month']

const getSort = (searchParams: URLSearchParams): string | undefined => {
  const sort = searchParams.get('sort') ?? searchParams.get('tab')?.toLowerCase()

  if (sort && validSorts.includes(sort)) {
    return sort
  }
}

export const parseStackExchangeUrl = (url: string): StackExchangeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOrSubdomainOf(parsedUrl, domains)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag, sort: getSort(searchParams) }
  }

  const questionId = pathname.match(questionRegex)?.[1]

  if (questionId) {
    return { kind: 'question', questionId }
  }

  const userId = pathname.match(userRegex)?.[1]

  if (userId) {
    return { kind: 'user', userId }
  }

  const collective = pathname.match(collectiveRegex)?.[1]

  if (collective) {
    return { kind: 'collective', collective }
  }

  if (pathname === '/') {
    return { kind: 'home' }
  }
}

export const stackExchangeHandler: PlatformHandler = {
  match: (url) => {
    return parseStackExchangeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseStackExchangeUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'tag') {
      const sortQuery = parsed.sort ? `?sort=${parsed.sort}` : ''

      return [
        {
          uri: `${origin}/feeds/tag/${parsed.tag}${sortQuery}`,
          hint: composeHint('stackexchange:tag'),
        },
      ]
    }

    if (parsed.kind === 'question') {
      return [
        {
          uri: `${origin}/feeds/question/${parsed.questionId}`,
          hint: composeHint('stackexchange:question'),
        },
      ]
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `${origin}/feeds/user/${parsed.userId}`,
          hint: composeHint('stackexchange:user'),
        },
      ]
    }

    if (parsed.kind === 'collective') {
      return [
        {
          uri: `${origin}/feeds/collectives/${parsed.collective}`,
          hint: composeHint('stackexchange:collective'),
        },
      ]
    }

    // Homepage: site-wide newest questions feed.
    return [
      {
        uri: `${origin}/feeds`,
        hint: composeHint('stackexchange:newest'),
      },
    ]
  },
}
