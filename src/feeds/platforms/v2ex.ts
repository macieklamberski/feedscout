import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type V2exUrl =
  | { kind: 'node'; node: string }
  | { kind: 'member'; username: string }
  | { kind: 'tab'; tab: string }
  | { kind: 'home' }

const hosts = ['www.v2ex.com', 'v2ex.com']

const nodeRegex = /^\/go\/([^/]+)/i
const memberRegex = /^\/member\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'v2ex:node', template: 'https://www.v2ex.com/feed/{node}.xml' },
  { key: 'v2ex:member', template: 'https://www.v2ex.com/feed/member/{username}.xml' },
  { key: 'v2ex:tab', template: 'https://www.v2ex.com/feed/tab/{tab}.xml' },
  { key: 'v2ex:index', template: 'https://www.v2ex.com/index.xml' },
])

export const parseV2exUrl = (url: string): V2exUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const node = pathname.match(nodeRegex)?.[1]

  if (node) {
    return { kind: 'node', node }
  }

  const username = pathname.match(memberRegex)?.[1]

  if (username) {
    return { kind: 'member', username }
  }

  const tab = getQueryParam(searchParams, 'tab')

  if (tab) {
    return { kind: 'tab', tab }
  }

  return { kind: 'home' }
}

export const v2exHandler: PlatformHandler = {
  match: (url) => {
    return parseV2exUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseV2exUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'node') {
      return [feeds.getFeedEntry('v2ex:node', { node: parsed.node })]
    }

    if (parsed.kind === 'member') {
      return [feeds.getFeedEntry('v2ex:member', { username: parsed.username })]
    }

    if (parsed.kind === 'tab') {
      return [feeds.getFeedEntry('v2ex:tab', { tab: parsed.tab }), feeds.getFeedEntry('v2ex:index')]
    }

    return [feeds.getFeedEntry('v2ex:index')]
  },

  getFeedKey: feeds.getFeedKey,
}
