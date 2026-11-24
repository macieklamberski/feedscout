import { webnode } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: articles.
// Handler needed for: section.

export type WebnodeUrl = { kind: 'section'; section: string } | { kind: 'site' }

const feeds = withHintLabels(webnode.feeds)

// The classic editor loads its client script from this host on every page. Webnode 2 pages load
// none of it and serve no feeds.
export const isWebnodeHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return (
      element.name === 'script' && webnode.pages.read(element.attribs.src ?? '')?.key === 'client'
    )
  })

  return script !== undefined
}

// A section feed is named after its articles block, which takes the page's slug. A repeated name
// gets a number suffix the URL does not show, and that page gets the unnumbered feed.
export const parseWebnodeUrl = (url: string): WebnodeUrl => {
  const page = webnode.pages.read(url, { isAnyHost: true })

  if (page?.key !== 'section') {
    return { kind: 'site' }
  }

  return { kind: 'section', section: page.params.section }
}

export const webnodeHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isWebnodeHtml })
  },

  resolve: (url) => {
    const parsed = parseWebnodeUrl(url)
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.kind === 'section') {
      return [
        page.getFeedEntry('section', { section: parsed.section }),
        page.getFeedEntry('articles'),
      ]
    }

    return [page.getFeedEntry('articles')]
  },

  getFeedHint: feeds.getFeedHint,
}
