import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers topics (html), partly covers node.

export type HomelandUrl = { kind: 'node'; node: string } | { kind: 'topics' }

const nodePathRegex = /\/topics\/node(\d+)(?:\/|$)/i

// A forum is self-hosted on any domain, so the table only builds its feeds.
const feeds = definePlatformFeeds([
  { key: 'homeland:node', main: '{root}/topics/node{node}/feed' },
  { key: 'homeland:topics', main: '{root}/topics/feed' },
])

export const isHomelandHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Homeland')
}

export const isHomelandHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('_homeland_session')
}

export const parseHomelandUrl = (url: string): HomelandUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const node = parsedUrl.pathname.match(nodePathRegex)?.[1]

  if (node) {
    return { kind: 'node', node }
  }

  return { kind: 'topics' }
}

export const homelandHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isHomelandHtml, headers: isHomelandHeaders })) {
      return false
    }

    return parseHomelandUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHomelandUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'node') {
      return [
        page.getFeedEntry('homeland:node', { node: parsed.node }),
        page.getFeedEntry('homeland:topics'),
      ]
    }

    return [page.getFeedEntry('homeland:topics')]
  },
}
