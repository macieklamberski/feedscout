import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type V2exUrl =
  | { kind: 'node'; node: string }
  | { kind: 'member'; username: string }
  | { kind: 'tab'; tab: string }
  | { kind: 'home' }

const hosts = ['www.v2ex.com', 'v2ex.com']

const nodeRegex = /^\/go\/([^/]+)/i
const memberRegex = /^\/member\/([^/]+)/i

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

  const tab = searchParams.get('tab')

  if (tab) {
    return { kind: 'tab', tab }
  }

  if (pathname === '/') {
    return { kind: 'home' }
  }
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
      return [
        {
          // V2EX serves node feeds in lowercase only: /feed/Python.xml answers 404.
          uri: `https://www.v2ex.com/feed/${parsed.node.toLowerCase()}.xml`,
          hint: composeHint('v2ex:node'),
        },
      ]
    }

    if (parsed.kind === 'member') {
      return [
        {
          uri: `https://www.v2ex.com/feed/member/${parsed.username}.xml`,
          hint: composeHint('v2ex:member'),
        },
      ]
    }

    if (parsed.kind === 'tab') {
      return [
        {
          // V2EX serves tab feeds in lowercase only: /feed/tab/TECH.xml answers 404.
          uri: `https://www.v2ex.com/feed/tab/${parsed.tab.toLowerCase()}.xml`,
          hint: composeHint('v2ex:tab'),
        },
        { uri: 'https://www.v2ex.com/index.xml', hint: composeHint('v2ex:index') },
      ]
    }

    return [
      {
        uri: 'https://www.v2ex.com/index.xml',
        hint: composeHint('v2ex:index'),
      },
    ]
  },
}
