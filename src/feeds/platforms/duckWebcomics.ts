import { duckWebcomics } from 'feedintel'
import { isSameText, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type DuckWebcomicsUrl = { kind: 'comic'; comic: string }

const feeds = withHintLabels(duckWebcomics.feeds)

export const parseDuckWebcomicsUrl = (url: string): DuckWebcomicsUrl | undefined => {
  const page = duckWebcomics.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'comic', comic: page.params.comic }
}

const getLinkedComic = (url: string, href: string | undefined): string | undefined => {
  const feedUrl = parseUrl(href, url)

  if (!feedUrl) {
    return
  }

  return duckWebcomics.feeds.read(feedUrl.href)?.params.comic
}

// The site answers a comic in any case, and its pages link the feed in the comic's own spelling.
const getFeedComic = (
  url: string,
  content: string | undefined,
  comic: string,
): string | undefined => {
  const anchor = findElement(content, (element) => {
    return isSameText(getLinkedComic(url, element.attribs.href), comic)
  })

  return getLinkedComic(url, anchor?.attribs.href)
}

const getDuckWebcomicsPage = (
  url: string,
  content: string | undefined,
): DuckWebcomicsUrl | undefined => {
  const parsed = parseDuckWebcomicsUrl(url)

  if (!parsed) {
    return
  }

  return { ...parsed, comic: getFeedComic(url, content, parsed.comic) ?? parsed.comic }
}

export const duckWebcomicsHandler: PlatformHandler = {
  match: (url) => {
    return parseDuckWebcomicsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getDuckWebcomicsPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('comic', { comic: page.comic })]
  },

  getFeedHint: feeds.getFeedHint,
}
