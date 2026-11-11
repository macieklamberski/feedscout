import { getAnyOf, getQueryParam, isHostOf, isHostOrSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

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
// The network host serves only the network-wide feed, and its user ids are network profile ids.
const networkHosts = ['stackexchange.com', 'www.stackexchange.com']

const tagRegex = /^\/questions\/tagged\/(?<tag>[^/]+)/i
const questionRegex = /^\/questions\/(?<questionId>[^/]+)/i
const userRegex = /^\/users\/(?<userId>[^/]+)/i
const collectiveRegex = /^\/collectives\/([^/]+)/i

// Sort values accepted by feeds.tag. Documented at api.stackexchange.com.
const validSorts = ['newest', 'active', 'votes', 'creation', 'hot', 'week', 'month']
const feeds = definePlatformFeeds(
  [
    // First under its key, so it writes every tag feed: an empty sort leaves the query out.
    { key: 'stackexchange:tag', template: 'https://{host}/feeds/tag/{tag}?sort={sort}' },
    { key: 'stackexchange:tag', template: 'https://{host}/feeds/tag/{tag}' },
    { key: 'stackexchange:question', template: 'https://{host}/feeds/question/{questionId}' },
    { key: 'stackexchange:user', template: 'https://{host}/feeds/user/{userId}' },
    { key: 'stackexchange:collective', template: 'https://{host}/feeds/collectives/{collective}' },
    { key: 'stackexchange:newest', template: 'https://{host}/feeds' },
  ],
  { domains },
)

const getSort = (searchParams: URLSearchParams): string | undefined => {
  const sort = getQueryParam(searchParams, 'sort') ?? getQueryParam(searchParams, 'tab')

  return getAnyOf(sort, validSorts)
}

export const parseStackExchangeUrl = (url: string): StackExchangeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOrSubdomainOf(parsedUrl, domains)) {
    return
  }

  const { pathname, searchParams } = parsedUrl

  if (isHostOf(parsedUrl, networkHosts)) {
    if (pathname === '/') {
      return { kind: 'home' }
    }

    return
  }
  const tag = pathname.match(tagRegex)?.groups?.tag

  if (tag) {
    return { kind: 'tag', tag, sort: getSort(searchParams) }
  }

  const questionId = pathname.match(questionRegex)?.groups?.questionId

  if (questionId && digitsRegex.test(questionId)) {
    return { kind: 'question', questionId }
  }

  const userId = pathname.match(userRegex)?.groups?.userId

  if (userId && digitsRegex.test(userId)) {
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
    const host = parseUrl(url)?.hostname

    if (!parsed || !host) {
      return []
    }

    if (parsed.kind === 'tag') {
      const params = { host, tag: parsed.tag, sort: parsed.sort ?? '' }

      return [feeds.getFeedEntry('stackexchange:tag', params)]
    }

    if (parsed.kind === 'question') {
      return [feeds.getFeedEntry('stackexchange:question', { host, questionId: parsed.questionId })]
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('stackexchange:user', { host, userId: parsed.userId })]
    }

    if (parsed.kind === 'collective') {
      const params = { host, collective: parsed.collective }

      return [feeds.getFeedEntry('stackexchange:collective', params)]
    }

    return [feeds.getFeedEntry('stackexchange:newest', { host })]
  },

  getFeedKey: (url) => {
    const key = feeds.getFeedKey(url)

    if (isHostOf(url, networkHosts) && key !== 'stackexchange:newest') {
      return
    }

    return key
  },
}
