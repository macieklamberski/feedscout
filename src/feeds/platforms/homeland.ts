import { homeland } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: topics.
// Handler needed for: node.

export type HomelandUrl = { kind: 'node'; node: string } | { kind: 'topics' }

const feeds = withHintLabels(homeland.feeds)

export const isHomelandHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Homeland')
}

export const isHomelandHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('_homeland_session')
}

export const parseHomelandUrl = (url: string): HomelandUrl | undefined => {
  const page = homeland.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  if (page.key === 'node') {
    return { kind: 'node', node: page.params.node }
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
      return [page.getFeedEntry('node', { node: parsed.node }), page.getFeedEntry('topics')]
    }

    return [page.getFeedEntry('topics')]
  },
}
