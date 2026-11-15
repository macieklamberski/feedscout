import { getQueryParam, isAnyOf, isSubdomainOf, parseUrl, resolveUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  digitsRegex,
  findElements,
  getCookieNames,
  hasMarker,
  hexOrHyphenRegex,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LegistarUrl =
  | { kind: 'legislation'; id: string; guid: string }
  | { kind: 'meeting'; id: string; guid: string }
type LegistarRecord = { id: string; guid: string }
export type LegistarPage = { kind: 'legislation' | 'meeting'; feedUrl: string }

const domains = ['legistar.com']

// Legistar's load balancer sets this cookie on every page, on a client's custom domain too.
const cookieName = 'BIGipServerinsite.legistar.com_443'

// A feed on a client's custom domain carries nothing that names Legistar, so the table claims a
// feed only on a Legistar host and builds it on any.
const feeds = definePlatformFeeds(
  [
    {
      key: 'legistar:legislation',
      template: '{scheme}://{host}/Feed.ashx?M=LD&ID={id}&GUID={guid}',
    },
    {
      key: 'legistar:meeting',
      template: '{scheme}://{host}/Feed.ashx?M=CalendarDetail&ID={id}&GUID={guid}',
    },
  ],
  { domains },
)

// Every page loads the share widget under Legistar's own account, on a custom domain too.
export const isLegistarHtml = (content: string): boolean => {
  return content.includes('addthis_widget.js#username=legistarinsite')
}

export const isLegistarHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes(cookieName)
}

// Feed.ashx answers 410 to an id without its own GUID, so a record is read only with both.
const getRecord = (searchParams: URLSearchParams): LegistarRecord | undefined => {
  const id = getQueryParam(searchParams, 'id')
  const guid = getQueryParam(searchParams, 'guid')

  if (!id || !guid || !digitsRegex.test(id) || !hexOrHyphenRegex.test(guid)) {
    return
  }

  return { id, guid }
}

export const parseLegistarUrl = (url: string): LegistarUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const record = getRecord(parsedUrl.searchParams)

  if (!record) {
    return
  }

  const { id, guid } = record

  if (isAnyOf(parsedUrl.pathname, '/LegislationDetail.aspx')) {
    return { kind: 'legislation', id, guid }
  }

  if (!isAnyOf(parsedUrl.pathname, '/MeetingDetail.aspx')) {
    return
  }

  return { kind: 'meeting', id, guid }
}

// A meeting page's alternate link appends a `Title` the page URL does not carry, so the feed is
// spelled as the page links it when the page names the same feed, and from the page URL otherwise.
const getFeedUrl = (url: string, content: string | undefined, feedUrl: string): string => {
  if (!content) {
    return feedUrl
  }

  const feedKey = feedUrl.toLowerCase()
  const links = findElements(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })

  for (const link of links) {
    const href = resolveUrl(link.attribs.href ?? '', url)
    const hrefKey = href?.toLowerCase()

    if (href && (hrefKey === feedKey || hrefKey?.startsWith(`${feedKey}&`))) {
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
    const feedUrl = pageFeeds.getFeedUrl('legistar:legislation', { id, guid })

    if (!feedUrl) {
      return
    }

    return { kind: 'legislation', feedUrl: getFeedUrl(url, content, feedUrl) }
  }

  const feedUrl = pageFeeds.getFeedUrl('legistar:meeting', { id, guid })

  if (!feedUrl) {
    return
  }

  return { kind: 'meeting', feedUrl: getFeedUrl(url, content, feedUrl) }
}

export const legistarHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (
      !isSubdomainOf(url, domains) &&
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
