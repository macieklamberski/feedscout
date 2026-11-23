import { legistar } from 'feedintel'
import { isSameText, parseUrl, resolveUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElements, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LegistarUrl =
  | { kind: 'legislation'; id: string; guid: string }
  | { kind: 'meeting'; id: string; guid: string }
export type LegistarPage = { kind: 'legislation' | 'meeting'; feedUrl: string }

// Legistar's load balancer sets this cookie on every page, on a client's custom domain too.
const cookieName = 'BIGipServerinsite.legistar.com_443'

const feeds = withHintLabels(legistar.feeds)

// Every page loads the share widget under Legistar's own account, on a custom domain too.
export const isLegistarHtml = (content: string): boolean => {
  return content.includes('addthis_widget.js#username=legistarinsite')
}

export const isLegistarHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes(cookieName)
}

export const parseLegistarUrl = (url: string): LegistarUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const page = legistar.pages.read(url, { root: parsedUrl.origin })

  if (!page) {
    return
  }

  const { id, guid } = page.params

  if (page.key === 'legislation') {
    return { kind: 'legislation', id, guid }
  }

  return { kind: 'meeting', id, guid }
}

// The page link writes the feed's parameters in its own order, beside others such as `Title`.
const isSameFeed = (parsed: LegistarUrl, href: string, root: string): boolean => {
  const feed = legistar.feeds.read(href, { root })

  return (
    feed?.key === parsed.kind &&
    feed.params.id === parsed.id &&
    isSameText(feed.params.guid, parsed.guid)
  )
}

// A meeting page's alternate link appends a `Title` the page URL does not carry, so the feed is
// spelled as the page links it when the page names the same feed, and from the page URL otherwise.
const getFeedUrl = (
  url: string,
  content: string | undefined,
  parsed: LegistarUrl,
  feedUrl: string,
): string => {
  const root = parseUrl(url)?.origin

  if (!content || !root) {
    return feedUrl
  }

  const links = findElements(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })

  for (const link of links) {
    const href = resolveUrl(link.attribs.href ?? '', url)

    if (href && isSameFeed(parsed, href, root)) {
      return href
    }
  }

  return feedUrl
}

export const getLegistarPage = (
  url: string,
  content: string | undefined,
): LegistarPage | undefined => {
  const parsed = parseLegistarUrl(url)
  const pageFeeds = feeds.forUrl(url)

  if (!parsed || !pageFeeds) {
    return
  }

  const { id, guid } = parsed

  if (parsed.kind === 'legislation') {
    const feedUrl = pageFeeds.getFeedUrl('legislation', { id, guid })

    if (!feedUrl) {
      return
    }

    return { kind: 'legislation', feedUrl: getFeedUrl(url, content, parsed, feedUrl) }
  }

  const feedUrl = pageFeeds.getFeedUrl('meeting', { id, guid })

  if (!feedUrl) {
    return
  }

  return { kind: 'meeting', feedUrl: getFeedUrl(url, content, parsed, feedUrl) }
}

export const legistarHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (
      !legistar.pages.read(url) &&
      !hasMarker(content, headers, { html: isLegistarHtml, headers: isLegistarHeaders })
    ) {
      return false
    }

    return parseLegistarUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getLegistarPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'legislation') {
      return [{ uri: page.feedUrl, hint: composeHint('legistar:legislation') }]
    }

    return [{ uri: page.feedUrl, hint: composeHint('legistar:meeting') }]
  },

  getFeedHint: feeds.getFeedHint,
}
