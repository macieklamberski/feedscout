import { proboards } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProboardsUrl = { kind: 'forum' } | { kind: 'customDomain' }

const feeds = withHintLabels(proboards.feeds)

// Every forum page loads the core script from storage.proboards.com or storage.forums.net, on a
// custom domain too.
export const isProboardsHtml = (content: string): boolean => {
  return content.includes('/forum/js/proboards.combined_')
}

export const parseProboardsUrl = (url: string): ProboardsUrl | undefined => {
  const page = proboards.pages.read(url)

  if (!page) {
    return { kind: 'customDomain' }
  }

  if (page.key === 'platform') {
    return
  }

  return { kind: 'forum' }
}

export const proboardsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseProboardsUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isProboardsHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseProboardsUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
