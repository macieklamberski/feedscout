import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers topics (html), partly covers node.

export type HomelandUrl = { kind: 'node'; node: string } | { kind: 'topics' }

const nodePathRegex = /\/topics\/node(\d+)(?:\/|$)/i

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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'node') {
      uris.push({
        uri: `${origin}/topics/node${parsed.node}/feed`,
        hint: composeHint('homeland:node'),
      })
    }

    uris.push({ uri: `${origin}/topics/feed`, hint: composeHint('homeland:topics') })

    return uris
  },
}
