import { getPathSegments, isHostOf, isSameText, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, wordRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type DuckWebcomicsUrl = { kind: 'comic'; comic: string }

const hosts = ['theduckwebcomics.com', 'www.theduckwebcomics.com']

const feedPathRegex = /^\/(\w+)\/rss\/$/i

const feeds = definePlatformFeeds(
  [{ key: 'duck-webcomics:comic', template: 'https://{host}/{comic}/rss/' }],
  { hosts },
)

export const parseDuckWebcomicsUrl = (url: string): DuckWebcomicsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [comic] = getPathSegments(url)

  if (!comic || !wordRegex.test(comic)) {
    return
  }

  return { kind: 'comic', comic }
}

// The site answers a comic in any case, and its pages link the feed in the comic's own spelling.
const getFeedComic = (content: string | undefined, comic: string): string | undefined => {
  const anchor = findElement(content, (element) => {
    return isSameText(element.attribs.href?.match(feedPathRegex)?.[1], comic)
  })

  return anchor?.attribs.href?.match(feedPathRegex)?.[1]
}

const getDuckWebcomicsPage = (
  url: string,
  content: string | undefined,
): DuckWebcomicsUrl | undefined => {
  const parsed = parseDuckWebcomicsUrl(url)

  if (!parsed) {
    return
  }

  return { ...parsed, comic: getFeedComic(content, parsed.comic) ?? parsed.comic }
}

export const duckWebcomicsHandler: PlatformHandler = {
  match: (url) => {
    return parseDuckWebcomicsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getDuckWebcomicsPage(url, content)
    const host = parseUrl(url)?.hostname

    if (!page || !host) {
      return []
    }

    return [feeds.getFeedEntry('duck-webcomics:comic', { host, comic: page.comic })]
  },

  getFeedKey: feeds.getFeedKey,
}
