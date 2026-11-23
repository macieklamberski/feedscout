import { podhome } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElements } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Every show site, on serve.podhome.fm or a custom domain, loads the servesite assets and links
// the show feed at serve.podhome.fm/rss/{id}, an id the page URL does not carry.
export type PodhomePage = { feedIds: Array<string> }

const assetPath = 'cdn.podhome.fm/servesite'

const feeds = withHintLabels(podhome.feeds)

const getPodhomePage = (url: string, content: string | undefined): PodhomePage | undefined => {
  if (!content?.includes(assetPath)) {
    return
  }

  const links = findElements(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      Boolean(element.attribs.href)
    )
  })
  const feedIds: Array<string> = []

  for (const link of links) {
    const feedUrl = parseUrl(link.attribs.href, url)
    const feedId = feedUrl && podhome.feeds.read(feedUrl.href)?.params.feedId

    if (feedId) {
      feedIds.push(feedId)
    }
  }

  if (feedIds.length === 0) {
    return
  }

  return { feedIds }
}

export const podhomeHandler: PlatformHandler = {
  match: (url, content) => {
    return getPodhomePage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPodhomePage(url, content)

    if (!page) {
      return []
    }

    return page.feedIds.map((feedId) => {
      return feeds.getFeedEntry('podcast', { feedId })
    })
  },

  getFeedHint: feeds.getFeedHint,
}
