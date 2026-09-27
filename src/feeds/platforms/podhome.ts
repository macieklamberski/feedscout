import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElements } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['serve.podhome.fm']
const assetPath = 'cdn.podhome.fm/servesite'

const feedPathRegex = /^\/rss\/[^/]+$/

// Every show site, on serve.podhome.fm or a custom domain, loads the servesite assets and links
// the show feed at serve.podhome.fm/rss/{id}, an id the page URL does not carry.
const getFeedUrls = (url: string, content: string | undefined): Array<string> => {
  if (!content?.includes(assetPath)) {
    return []
  }

  const links = findElements(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      Boolean(element.attribs.href)
    )
  })
  const feedUrls: Array<string> = []

  for (const link of links) {
    const feedUrl = parseUrl(link.attribs.href, url)

    if (feedUrl && isHostOf(feedUrl, hosts) && feedPathRegex.test(feedUrl.pathname)) {
      feedUrls.push(feedUrl.href)
    }
  }

  return feedUrls
}

export const podhomeHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && getFeedUrls(url, content).length > 0
  },

  resolve: (url, content) => {
    return getFeedUrls(url, content).map((uri) => {
      return { uri, hint: composeHint('podhome:podcast') }
    })
  },
}
