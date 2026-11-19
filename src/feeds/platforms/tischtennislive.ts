import { tischtennislive } from 'feedintel'
import { getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: dates, documents, news, tournaments.

export type TischtennisliveUrl = { kind: 'association' }

export type TischtennislivePage =
  | { kind: 'association' }
  | { kind: 'group'; group: string }
  | { kind: 'league'; league: string }

const domains = tischtennislive.hosts.tenants

const feeds = withHintLabels(tischtennislive.feeds)

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

    return isHostOf(linkUrl, hostname) && isAnyOf(linkUrl.pathname, '/Export/Tischtennis/RSS.aspx')
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
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    // The association's news, dates, documents and tournaments need no value from the page, so
    // every page builds them after its own feeds.
    if (page.kind === 'group') {
      return [
        pageFeeds.getFeedEntry('group-results', { group: page.group }),
        pageFeeds.getFeedEntry('group-fixtures', { group: page.group }),
        pageFeeds.getFeedEntry('news'),
        pageFeeds.getFeedEntry('dates'),
        pageFeeds.getFeedEntry('documents'),
        pageFeeds.getFeedEntry('tournaments'),
      ]
    }

    if (page.kind === 'league') {
      return [
        pageFeeds.getFeedEntry('league-results', { league: page.league }),
        pageFeeds.getFeedEntry('league-fixtures', { league: page.league }),
        pageFeeds.getFeedEntry('news'),
        pageFeeds.getFeedEntry('dates'),
        pageFeeds.getFeedEntry('documents'),
        pageFeeds.getFeedEntry('tournaments'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('news'),
      pageFeeds.getFeedEntry('dates'),
      pageFeeds.getFeedEntry('documents'),
      pageFeeds.getFeedEntry('tournaments'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
