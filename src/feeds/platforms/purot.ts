import { purot } from 'feedintel'
import { encodePathSegment } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: page-activity, page-changes, page-discussions, recent-changes.
// Handler needed for: recent-discussions, recent-page-changes.

export type PurotUrl = { kind: 'wiki'; wiki: string }

export type PurotPage =
  | { kind: 'wiki'; wiki: string }
  | { kind: 'page'; wiki: string; page: string }

const domains = purot.hosts.tenants

// A profile id holds a slash, so a profile page never matches. A profile page links its user's
// feeds even when it answers "User not found", and a real profile redirects to the home page.
const pageChangesRegex = /^\/changes\/([^/?]+)\?mode=rss&messages=0$/i

const feeds = withHintLabels(purot.feeds)

export const parsePurotUrl = (url: string): PurotUrl | undefined => {
  const wiki = getTenantSubdomain(url, domains)

  if (!wiki) {
    return
  }

  return { kind: 'wiki', wiki }
}

// A made-up page id answers the whole wiki's changes, so the page comes from its own feed link,
// which also spells the id the way the wiki does for a url in another case.
export const getPurotPage = (url: string, content: string | undefined): PurotPage | undefined => {
  const parsed = parsePurotUrl(url)

  if (!parsed) {
    return
  }

  const link = findElement(content, (element) => {
    return element.name === 'link' && pageChangesRegex.test(element.attribs.href ?? '')
  })
  const page = link?.attribs.href?.match(pageChangesRegex)?.[1]

  if (!page) {
    return parsed
  }

  return { kind: 'page', wiki: parsed.wiki, page: encodePathSegment(page) }
}

export const purotHandler: PlatformHandler = {
  match: (url) => {
    return parsePurotUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getPurotPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    if (page.kind === 'page') {
      const params = { page: page.page }

      return [
        pageFeeds.getFeedEntry('page-changes', params),
        pageFeeds.getFeedEntry('page-discussions', params),
        pageFeeds.getFeedEntry('page-activity', params),
        pageFeeds.getFeedEntry('recent-changes'),
        pageFeeds.getFeedEntry('recent-page-changes'),
        pageFeeds.getFeedEntry('recent-discussions'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('recent-changes'),
      pageFeeds.getFeedEntry('recent-page-changes'),
      pageFeeds.getFeedEntry('recent-discussions'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
