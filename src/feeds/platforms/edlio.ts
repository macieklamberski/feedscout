import { edlio } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: news-category.
// Handler needed for: assignments, news.

const listPackPath = '/apps/js/common/list-pack.js'

const feeds = withHintLabels(edlio.feeds)

export type EdlioPage = { kind: 'site'; categoryId?: string } | { kind: 'class'; classId: string }

// A school's pages link its feeds by path on its own domain.
const readLinkedFeed = (url: string, href: string | undefined) => {
  const root = parseUrl(url)?.origin
  const feedUrl = parseUrl(href, url)

  if (!root || !feedUrl) {
    return
  }

  return edlio.feeds.read(feedUrl.href, { root })
}

export const isEdlioHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && element.attribs.src === listPackPath
  })

  return script !== undefined
}

// The news page links its category's feed, which serves only that category's news, so the
// category id is read from that link. A made-up `categoryid` answers 200 with an HTML page.
// A class page links its assignment feed by an anchor only, and the id is taken from the page url
// only when the page links that class's feed.
const getEdlioPage = (url: string, content: string | undefined): EdlioPage => {
  const classPage = edlio.pages.read(url, { isAnyHost: true })
  const classLink = findElement(content, (element) => {
    return element.name === 'a' && readLinkedFeed(url, element.attribs.href)?.key === 'assignments'
  })
  const classId = readLinkedFeed(url, classLink?.attribs.href)?.params.classId

  if (classId && classPage?.params.classId === classId) {
    return { kind: 'class', classId }
  }

  const newsLink = findElement(content, (element) => {
    return (
      element.name === 'link' && readLinkedFeed(url, element.attribs.href)?.key === 'news-category'
    )
  })
  const categoryId = readLinkedFeed(url, newsLink?.attribs.href)?.params.categoryId

  return { kind: 'site', categoryId }
}

export const edlioHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isEdlioHtml })
  },

  resolve: (url, content) => {
    const page = getEdlioPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    // The school's news needs no value from the page, so every page builds it after its own feeds.
    if (page.kind === 'class') {
      return [
        pageFeeds.getFeedEntry('assignments', { classId: page.classId }),
        pageFeeds.getFeedEntry('news'),
      ]
    }

    if (!page.categoryId) {
      return [pageFeeds.getFeedEntry('news')]
    }

    return [
      pageFeeds.getFeedEntry('news-category', { categoryId: page.categoryId }),
      pageFeeds.getFeedEntry('news'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
