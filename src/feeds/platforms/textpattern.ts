import { textpattern } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  findElement,
  getSiteParams,
  getSiteUrl,
  hasMarker,
  hasMetaContent,
  isRootOfPage,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TextpatternPage =
  | { kind: 'site'; siteUrl: string }
  | { kind: 'section'; siteUrl: string; section: string }
  | { kind: 'category'; siteUrl: string; category: string }

const feeds = withHintLabels(textpattern.feeds)

export const isTextpatternHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Textpattern')
}

type TextpatternPageMatch = ReturnType<typeof textpattern.pages.read>

const readFeedLink = (url: string, href: string | undefined): string | undefined => {
  const feedUrl = parseUrl(href, url)?.href ?? ''
  const feed = textpattern.feeds.read(feedUrl, { isAnyHost: true })

  if (!feed) {
    return
  }

  return getSiteUrl(feed.params)
}

// Textpattern serves its feeds at `{site}/rss` and `{site}/atom`, so the feed link a theme prints
// names the site root. It counts only under a root that holds the page, else the origin does.
const readPage = (url: string, content: string | undefined): TextpatternPageMatch => {
  const feedLink = findElement(content, (element) => {
    if (element.name !== 'link' || element.attribs.rel !== 'alternate') {
      return false
    }

    return readFeedLink(url, element.attribs.href) !== undefined
  })
  const feedRoot = readFeedLink(url, feedLink?.attribs.href)

  if (feedRoot && isRootOfPage(feedRoot, url)) {
    const page = textpattern.pages.read(url, { base: getSiteParams(feedRoot)?.base })

    if (page) {
      return page
    }
  }

  return textpattern.pages.read(url, { base: [] })
}

export const getTextpatternPage = (
  url: string,
  content: string | undefined,
): TextpatternPage | undefined => {
  const page = readPage(url, content)

  if (!page) {
    return
  }

  const siteUrl = getSiteUrl(page.params)

  if (page.key === 'category') {
    return { kind: 'category', siteUrl, category: page.params.category }
  }

  if (page.key === 'section') {
    return { kind: 'section', siteUrl, section: page.params.section }
  }

  return { kind: 'site', siteUrl }
}

export const textpatternHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isTextpatternHtml })
  },

  resolve: (url, content) => {
    const page = getTextpatternPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'section') {
      const params = { ...getSiteParams(page.siteUrl), section: page.section }

      return [
        feeds.getFeedEntry('section', params, 'rss'),
        feeds.getFeedEntry('section', params, 'atom'),
        feeds.getFeedEntry('posts', params, 'rss'),
        feeds.getFeedEntry('posts', params, 'atom'),
      ]
    }

    if (page.kind === 'category') {
      const params = { ...getSiteParams(page.siteUrl), category: page.category }

      return [
        feeds.getFeedEntry('category', params, 'rss'),
        feeds.getFeedEntry('category', params, 'atom'),
        feeds.getFeedEntry('posts', params, 'rss'),
        feeds.getFeedEntry('posts', params, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', getSiteParams(page.siteUrl), 'rss'),
      feeds.getFeedEntry('posts', getSiteParams(page.siteUrl), 'atom'),
    ]
  },
}
