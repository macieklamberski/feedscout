import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElements } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['serve.podhome.fm']
const assetPath = 'cdn.podhome.fm/servesite'

const feedPathRegex = /^\/rss\/[^/]+$/

// Every show site, on serve.podhome.fm or a custom domain, loads the servesite assets and links
// the show feed at serve.podhome.fm/rss/{id}, an id the page URL does not carry.
export type PodhomePage = { feedUrls: Array<string> }

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
  const feedUrls: Array<string> = []

  for (const link of links) {
    const feedUrl = parseUrl(link.attribs.href, url)

    if (feedUrl && isHostOf(feedUrl, hosts) && feedPathRegex.test(feedUrl.pathname)) {
      feedUrls.push(feedUrl.href)
    }
  }

  if (feedUrls.length === 0) {
    return
  }

  return { feedUrls }
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

    return page.feedUrls.map((uri) => {
      return { uri, hint: composeHint('podhome:podcast') }
    })
  },
}
