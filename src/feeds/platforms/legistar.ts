import { composeQuery, getQueryParam, isAnyOf, isSubdomainOf, parseUrl, resolveUrl } from 'trousse'
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

const legislationPathRegex = /^\/LegislationDetail\.aspx$/i
const meetingPathRegex = /^\/MeetingDetail\.aspx$/i
const feedPathRegex = /^\/Feed\.ashx$/i

// Legistar's load balancer sets this cookie on every page, on a client's custom domain too.
const cookieName = 'BIGipServerinsite.legistar.com_443'

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

  if (legislationPathRegex.test(parsedUrl.pathname)) {
    return { kind: 'legislation', id, guid }
  }

  if (!meetingPathRegex.test(parsedUrl.pathname)) {
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

  if (!parsed) {
    return
  }

  const { origin } = new URL(url)

  if (parsed.kind === 'legislation') {
    const query = composeQuery({ M: 'LD', ID: parsed.id, GUID: parsed.guid })

    return { kind: 'legislation', feedUrl: getFeedUrl(url, content, `${origin}/Feed.ashx${query}`) }
  }

  const query = composeQuery({ M: 'CalendarDetail', ID: parsed.id, GUID: parsed.guid })

  return { kind: 'meeting', feedUrl: getFeedUrl(url, content, `${origin}/Feed.ashx${query}`) }
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

  // A custom domain carries no marker in the URL alone, so only a feed on a Legistar host is read.
  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isSubdomainOf(url, domains) || !feedPathRegex.test(parsedUrl.pathname)) {
      return
    }

    if (!getRecord(parsedUrl.searchParams)) {
      return
    }

    const mode = getQueryParam(parsedUrl.searchParams, 'm')

    if (isAnyOf(mode, 'LD')) {
      return composeHint('legistar:legislation')
    }

    if (isAnyOf(mode, 'CalendarDetail')) {
      return composeHint('legistar:meeting')
    }
  },
}
