import { getAnyOf, getQueryParam, isAnyOf, isHostOf, isHostOrSubdomainOf, parseUrl } from 'trousse'
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
// The network host serves only the network-wide feed and tag sets, and its user ids are network
// profile ids.
const networkHosts = ['stackexchange.com', 'www.stackexchange.com']

const tagRegex = /^\/questions\/tagged\/(?<tag>[^/]+)/i
const questionRegex = /^\/questions\/(?<questionId>[^/]+)/i
const userRegex = /^\/users\/(?<userId>[^/]+)/i
const collectiveRegex = /^\/collectives\/([^/]+)/i

// A site's meta, such as music.meta.stackexchange.com or ru.meta.stackoverflow.com, serves the
// same feeds one label deeper.
const feedDomains = [...domains, 'meta.stackexchange.com', 'meta.stackoverflow.com']

// Sort values accepted by feeds.tag. Documented at api.stackexchange.com.
const validSorts = ['newest', 'active', 'votes', 'creation', 'hot', 'week', 'month']
// The `tagnames` query serves the same items as the tag path, and the weekly and monthly hot lists
// are the site feed sorted. The rows past the user feed are claimed only: chat starred messages,
// Area 51 proposals and a network tag set.
const feeds = definePlatformFeeds(
  [
    { key: 'stackexchange:tag', template: '{scheme}://{host}/feeds/tag/{tag}?sort={sort}' },
    { key: 'stackexchange:tag', template: '{scheme}://{host}/feeds/tag/{tag}' },
    {
      key: 'stackexchange:tag',
      template: '{scheme}://{host}/feeds/tag?tagnames={tag}',
      isAlias: true,
    },
    { key: 'stackexchange:question', template: '{scheme}://{host}/feeds/question/{questionId}' },
    { key: 'stackexchange:user', template: '{scheme}://{host}/feeds/user/{userId}' },
    {
      key: 'stackexchange:chat-starred',
      template: '{scheme}://{host}/feeds/rooms/starred/{roomId}',
    },
    { key: 'stackexchange:proposal', template: '{scheme}://{host}/feeds/proposal/{proposalId}' },
    { key: 'stackexchange:tagset', template: '{scheme}://{host}/feeds/tagsets/{tagsetId}/{name}' },
    {
      key: 'stackexchange:collective',
      template: '{scheme}://{host}/feeds/collectives/{collective}',
    },
    { key: 'stackexchange:newest', template: '{scheme}://{host}/feeds' },
    { key: 'stackexchange:newest', template: '{scheme}://{host}/feeds/week' },
    { key: 'stackexchange:newest', template: '{scheme}://{host}/feeds/month' },
  ],
  { hosts: domains, domains: feedDomains },
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('stackexchange:tag', { tag: parsed.tag, sort: parsed.sort })]
    }

    if (parsed.kind === 'question') {
      return [page.getFeedEntry('stackexchange:question', { questionId: parsed.questionId })]
    }

    if (parsed.kind === 'user') {
      return [page.getFeedEntry('stackexchange:user', { userId: parsed.userId })]
    }

    if (parsed.kind === 'collective') {
      return [page.getFeedEntry('stackexchange:collective', { collective: parsed.collective })]
    }

    return [page.getFeedEntry('stackexchange:newest')]
  },

  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (
      isHostOf(url, networkHosts) &&
      !isAnyOf(hint?.key, ['stackexchange:newest', 'stackexchange:tagset'])
    ) {
      return
    }

    return hint
  },
}
