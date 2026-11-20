import { edlio } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: news-category.
// Handler needed for: assignments, news.

const listPackPath = '/apps/js/common/list-pack.js'

const newsFeedHrefRegex = /^\/apps\/news\/rss\?categoryid=(\d+)$/i
const classPathRegex = /^\/apps\/classes\/(\d+)(?:\/|$)/i
const classFeedHrefRegex = /^\/apps\/classes\/assignment_rss\.jsp\?classREC_ID=(\d+)$/i

const feeds = withHintLabels(edlio.feeds)

export type EdlioPage = { kind: 'site'; categoryId?: string } | { kind: 'class'; classId: string }

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
  const { pathname } = new URL(url)
  const classLink = findElement(content, (element) => {
    return element.name === 'a' && classFeedHrefRegex.test(element.attribs.href ?? '')
  })
  const classId = classLink?.attribs.href?.match(classFeedHrefRegex)?.[1]

  if (classId && pathname.match(classPathRegex)?.[1] === classId) {
    return { kind: 'class', classId }
  }

  const newsLink = findElement(content, (element) => {
    return element.name === 'link' && newsFeedHrefRegex.test(element.attribs.href ?? '')
  })
  const categoryId = newsLink?.attribs.href?.match(newsFeedHrefRegex)?.[1]

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
