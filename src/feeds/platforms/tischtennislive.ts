import { getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers group, league (html), partly covers association.

export type TischtennisliveUrl = { kind: 'association' }

export type TischtennislivePage =
  | { kind: 'association' }
  | { kind: 'group'; group: string }
  | { kind: 'league'; league: string }

const domains = ['tischtennislive.de']

const resultsFeedPathRegex = /^\/Export\/Tischtennis\/RSS\.aspx$/i

// Next=0 lists the matches of the last 10 days and Next=1 those of the next 10 days.
const feeds = definePlatformFeeds(
  [
    {
      key: 'tischtennislive:group-results',
      template:
        '{scheme}://{association}.{domain}/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID={group}&Next=0',
    },
    {
      key: 'tischtennislive:group-fixtures',
      template:
        '{scheme}://{association}.{domain}/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID={group}&Next=1',
    },
    {
      key: 'tischtennislive:league-results',
      template:
        '{scheme}://{association}.{domain}/Export/Tischtennis/RSS.aspx?Typ=Wett&ID={league}&Next=0',
    },
    {
      key: 'tischtennislive:league-fixtures',
      template:
        '{scheme}://{association}.{domain}/Export/Tischtennis/RSS.aspx?Typ=Wett&ID={league}&Next=1',
    },
    { key: 'tischtennislive:news', template: '{scheme}://{association}.{domain}/Export/RSS.aspx' },
    {
      key: 'tischtennislive:dates',
      template: '{scheme}://{association}.{domain}/Export/RSS_Termine.aspx',
    },
    {
      key: 'tischtennislive:documents',
      template: '{scheme}://{association}.{domain}/Export/RSS_Dokumente.aspx',
    },
    {
      key: 'tischtennislive:tournaments',
      template: '{scheme}://{association}.{domain}/Export/Tischtennis/RSS_Turniere.aspx',
    },
  ],
  { domains },
)

export const parseTischtennisliveUrl = (url: string): TischtennisliveUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'association' }
}

// A results feed answers 200 to any id, and a made-up group id with another group's matches, so
// the id is read from the feed link the page prints and never from the page url.
export const getTischtennislivePage = (
  url: string,
  content: string | undefined,
): TischtennislivePage | undefined => {
  const parsed = parseTischtennisliveUrl(url)

  if (!parsed) {
    return
  }

  const { hostname } = new URL(url)
  const link = findElement(content, (element) => {
    if (element.name !== 'a') {
      return false
    }

    const linkUrl = parseUrl(element.attribs.href, url)

    if (!linkUrl) {
      return false
    }

    return isHostOf(linkUrl, hostname) && resultsFeedPathRegex.test(linkUrl.pathname)
  })
  const feedUrl = parseUrl(link?.attribs.href, url)
  const id = getQueryParam(feedUrl?.searchParams, 'id') ?? ''

  if (!digitsRegex.test(id)) {
    return parsed
  }

  const type = getQueryParam(feedUrl?.searchParams, 'typ')

  if (isAnyOf(type, 'Gruppe')) {
    return { kind: 'group', group: id }
  }

  if (isAnyOf(type, 'Wett')) {
    return { kind: 'league', league: id }
  }

  return parsed
}

export const tischtennisliveHandler: PlatformHandler = {
  match: (url) => {
    return parseTischtennisliveUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getTischtennislivePage(url, content)

    if (!page) {
      return []
    }

    // A page is read only on an association's own subdomain, its first host label.
    const { protocol, hostname } = new URL(url)
    const [association] = hostname.split('.')
    const params = { scheme: protocol.slice(0, -1), association, domain: domains[0] }

    if (page.kind === 'group') {
      return [
        feeds.getFeedEntry('tischtennislive:group-results', { ...params, group: page.group }),
        feeds.getFeedEntry('tischtennislive:group-fixtures', { ...params, group: page.group }),
      ]
    }

    if (page.kind === 'league') {
      return [
        feeds.getFeedEntry('tischtennislive:league-results', { ...params, league: page.league }),
        feeds.getFeedEntry('tischtennislive:league-fixtures', { ...params, league: page.league }),
      ]
    }

    return [
      feeds.getFeedEntry('tischtennislive:news', params),
      feeds.getFeedEntry('tischtennislive:dates', params),
      feeds.getFeedEntry('tischtennislive:documents', params),
      feeds.getFeedEntry('tischtennislive:tournaments', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
