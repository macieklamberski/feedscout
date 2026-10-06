import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers news (guess, html).
// Handler needed for: class, home.

const listPackPath = '/apps/js/common/list-pack.js'

const newsFeedHrefRegex = /^\/apps\/news\/rss\?categoryid=(\d+)$/
const classPathRegex = /^\/apps\/classes\/(\d+)(?:\/|$)/
const classFeedHrefRegex = /^\/apps\/classes\/assignment_rss\.jsp\?classREC_ID=(\d+)$/

export type EdlioPage =
  | { kind: 'site'; origin: string; categoryId?: string }
  | { kind: 'class'; origin: string; classId: string }

export const isEdlioHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && element.attribs.src === listPackPath
  })

  return script !== undefined
}

// The news page links its category's feed, which serves what the feed without a category serves,
// so the category id is read from that link. A made-up `categoryid` answers 200 with an HTML page.
// A class page links its assignment feed by an anchor only, and the id is taken from the page url
// only when the page links that class's feed.
const getEdlioPage = (url: string, content: string | undefined): EdlioPage => {
  const { origin, pathname } = new URL(url)
  const classLink = findElement(content, (element) => {
    return element.name === 'a' && classFeedHrefRegex.test(element.attribs.href ?? '')
  })
  const classId = classLink?.attribs.href?.match(classFeedHrefRegex)?.[1]

  if (classId && pathname.match(classPathRegex)?.[1] === classId) {
    return { kind: 'class', origin, classId }
  }

  const newsLink = findElement(content, (element) => {
    return element.name === 'link' && newsFeedHrefRegex.test(element.attribs.href ?? '')
  })
  const categoryId = newsLink?.attribs.href?.match(newsFeedHrefRegex)?.[1]

  return { kind: 'site', origin, categoryId }
}

export const edlioHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isEdlioHtml })
  },

  resolve: (url, content) => {
    const page = getEdlioPage(url, content)

    if (page.kind === 'class') {
      const query = new URLSearchParams({ classREC_ID: page.classId })
      const feedUrl = `${page.origin}/apps/classes/assignment_rss.jsp?${query}`

      return [{ uri: feedUrl, hint: composeHint('edlio:assignments') }]
    }

    const feedUrl = `${page.origin}/apps/news/rss`

    if (!page.categoryId) {
      return [{ uri: feedUrl, hint: composeHint('edlio:news') }]
    }

    const query = new URLSearchParams({ categoryid: page.categoryId })

    return [{ uri: `${feedUrl}?${query}`, hint: composeHint('edlio:news') }]
  },
}
