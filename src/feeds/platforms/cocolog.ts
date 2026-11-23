import { cocolog } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CocologPage = { blog: string }

const feeds = withHintLabels(cocolog.feeds)

const getLinkedBlog = (url: string, href: string | undefined, host: string): string | undefined => {
  const feedUrl = parseUrl(href, url)

  if (!feedUrl) {
    return
  }

  const feed = cocolog.feeds.read(feedUrl.href)

  if (feed?.key !== 'posts' || !isHostOf(feedUrl, host)) {
    return
  }

  return feed.params.blog
}

const getCocologPage = (url: string, content: string | undefined): CocologPage | undefined => {
  const page = cocolog.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'blog') {
    return { blog: page.params.blog }
  }

  // One account hosts several blogs, each under its own path, and the home page names only one
  // of them, in its feed links.
  const link = findElement(content, (element) => {
    if (element.name !== 'link' || element.attribs.rel !== 'alternate') {
      return false
    }

    return getLinkedBlog(url, element.attribs.href, page.params.host) !== undefined
  })
  const linkedBlog = getLinkedBlog(url, link?.attribs.href, page.params.host)

  if (!linkedBlog) {
    return
  }

  return { blog: linkedBlog }
}

export const cocologHandler: PlatformHandler = {
  match: (url, content) => {
    return getCocologPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getCocologPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = { blog: page.blog }

    return [
      pageFeeds.getFeedEntry('posts', params, 'atom'),
      pageFeeds.getFeedEntry('posts', params, 'rdf'),
      pageFeeds.getFeedEntry('posts', params, 'rss'),
      pageFeeds.getFeedEntry('comments', params, 'rdf'),
      pageFeeds.getFeedEntry('comments', params, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
