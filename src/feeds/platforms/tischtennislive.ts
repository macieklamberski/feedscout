import { tischtennislive } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: dates, documents, news, tournaments.

export type TischtennisliveUrl = { kind: 'association' }

export type TischtennislivePage =
  | { kind: 'association' }
  | { kind: 'group'; group: string }
  | { kind: 'league'; league: string }

const feeds = withHintLabels(tischtennislive.feeds)

export const parseTischtennisliveUrl = (url: string): TischtennisliveUrl | undefined => {
  if (!tischtennislive.pages.read(url)) {
    return
  }

  return { kind: 'association' }
}

const getLinkedPage = (href: string | undefined, url: string) => {
  const linkUrl = parseUrl(href, url)
  const page = linkUrl ? tischtennislive.pages.read(linkUrl.href) : undefined

  if (!linkUrl || !isHostOf(linkUrl, new URL(url).hostname) || page?.key === 'association') {
    return
  }

  return page
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

  const link = findElement(content, (element) => {
    return element.name === 'a' && getLinkedPage(element.attribs.href, url) !== undefined
  })
  const linkedPage = getLinkedPage(link?.attribs.href, url)

  if (linkedPage?.key === 'group') {
    return { kind: 'group', group: linkedPage.params.group }
  }

  if (linkedPage?.key === 'league') {
    return { kind: 'league', league: linkedPage.params.league }
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
