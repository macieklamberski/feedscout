import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TextpatternPage = { kind: 'site'; siteUrl: string }

const feedPathRegex = /\/(?:atom|rss)\/?$/i

export const isTextpatternHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Textpattern')
}

// Textpattern serves its feeds at `{site}/rss` and `{site}/atom`, so the feed link a theme prints
// names the site root. It counts only on the page's own host, under a root that holds the page.
const getSiteUrl = (url: string, content: string | undefined): string | undefined => {
  const parsedUrl = new URL(url)

  const feedLink = findElement(content, (element) => {
    if (element.name !== 'link' || element.attribs.rel !== 'alternate') {
      return false
    }

    return feedPathRegex.test(parseUrl(element.attribs.href ?? '', url)?.pathname ?? '')
  })

  if (!feedLink) {
    return
  }

  const feedUrl = parseUrl(feedLink.attribs.href ?? '', url)

  if (!feedUrl || feedUrl.origin !== parsedUrl.origin) {
    return
  }

  const sitePath = feedUrl.pathname.replace(feedPathRegex, '')

  if (!`${parsedUrl.pathname}/`.startsWith(`${sitePath}/`)) {
    return
  }

  return `${parsedUrl.origin}${sitePath}`
}

export const getTextpatternPage = (url: string, content: string | undefined): TextpatternPage => {
  return { kind: 'site', siteUrl: getSiteUrl(url, content) ?? new URL(url).origin }
}

export const textpatternHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isTextpatternHtml })
  },

  resolve: (url, content) => {
    const page = getTextpatternPage(url, content)

    return [
      { uri: `${page.siteUrl}/rss`, hint: composeHint('textpattern:posts', 'rss') },
      { uri: `${page.siteUrl}/atom`, hint: composeHint('textpattern:posts', 'atom') },
    ]
  },
}
