import { stackExchange } from 'feedintel'
import { getAnyOf, getQueryParam, isHostOf, isHostOrSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: question.
// Handler needed for: collective, newest, tag, user.

export type StackExchangeUrl =
  | { kind: 'tag'; tag: string; sort?: string }
  | { kind: 'question'; questionId: string }
  | { kind: 'user'; userId: string }
  | { kind: 'collective'; collective: string }
  | { kind: 'home' }

const domains = stackExchange.hosts.exact
// The network host serves only the network-wide feed and tag sets, and its user ids are network
// profile ids.
const networkHosts = ['stackexchange.com', 'www.stackexchange.com']

const tagRegex = /^\/questions\/tagged\/(?<tag>[^/]+)/i
const questionRegex = /^\/questions\/(?<questionId>[^/]+)/i
const userRegex = /^\/users\/(?<userId>[^/]+)/i
const collectiveRegex = /^\/collectives\/([^/]+)/i

// Sort values accepted by feeds.tag. Documented at api.stackexchange.com.
const validSorts = ['newest', 'active', 'votes', 'creation', 'hot', 'week', 'month']

const feeds = withHintLabels(stackExchange.feeds)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The newest questions feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag, sort: parsed.sort }),
        page.getFeedEntry('newest'),
      ]
    }

    if (parsed.kind === 'question') {
      return [
        page.getFeedEntry('question', { questionId: parsed.questionId }),
        page.getFeedEntry('newest'),
      ]
    }

    if (parsed.kind === 'user') {
      return [page.getFeedEntry('user', { userId: parsed.userId }), page.getFeedEntry('newest')]
    }

    if (parsed.kind === 'collective') {
      return [
        page.getFeedEntry('collective', { collective: parsed.collective }),
        page.getFeedEntry('newest'),
      ]
    }

    return [page.getFeedEntry('newest')]
  },

  getFeedHint: feeds.getFeedHint,
}
