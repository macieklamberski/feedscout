import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElements } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Every show site, on serve.podhome.fm or a custom domain, loads the servesite assets and links
// the show feed at serve.podhome.fm/rss/{id}, an id the page URL does not carry.
export type PodhomePage = { feedIds: Array<string> }

const hosts = ['serve.podhome.fm']
const assetPath = 'cdn.podhome.fm/servesite'

const feedPathRegex = /^\/rss\/([^/]+)$/i
const feedIdRegex =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32})$/i

const feeds = definePlatformFeeds([
  { key: 'podhome:podcast', template: 'https://serve.podhome.fm/rss/{feedId}' },
])

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
    const feedId = feedUrl && isHostOf(feedUrl, hosts) && feedPathRegex.exec(feedUrl.pathname)?.[1]

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
      return feeds.getFeedEntry('podhome:podcast', { feedId })
    })
  },

  getFeedHint: (url) => {
    const [, feedId] = getPathSegments(url)

    // A feed id is a GUID, with or without hyphens, so `xslsheet`, the stylesheet every feed links
    // under /rss/, and an all-hex word such as `feed` are no feed.
    if (!feedId || !feedIdRegex.test(feedId)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
