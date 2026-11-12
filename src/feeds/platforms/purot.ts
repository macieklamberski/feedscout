import { encodePathSegment } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PurotUrl = { kind: 'wiki'; wiki: string }

export type PurotPage =
  | { kind: 'wiki'; wiki: string }
  | { kind: 'page'; wiki: string; page: string }

const domains = ['purot.net']

// A profile id holds a slash, so a profile page never matches. A profile page links its user's
// feeds even when it answers "User not found", and a real profile redirects to the home page.
const pageChangesRegex = /^\/changes\/([^/?]+)\?mode=rss&messages=0$/i

// The wiki's changes come first, so its feed is not read as the activity of a page named all.
const feeds = definePlatformFeeds([
  { key: 'purot:recent-changes', template: 'https://{wiki}.purot.net/changes/all?mode=rss' },
  {
    key: 'purot:page-changes',
    template: 'https://{wiki}.purot.net/changes/{page}?mode=rss&messages=0',
  },
  {
    key: 'purot:page-discussions',
    template: 'https://{wiki}.purot.net/changes/{page}?mode=rss&pages=0',
  },
  { key: 'purot:page-activity', template: 'https://{wiki}.purot.net/changes/{page}?mode=rss' },
])

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

    if (!page) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'page') {
      const params = { wiki: page.wiki, page: page.page }

      uris.push(feeds.getFeedEntry('purot:page-changes', params))
      uris.push(feeds.getFeedEntry('purot:page-discussions', params))
      uris.push(feeds.getFeedEntry('purot:page-activity', params))
    }

    uris.push(feeds.getFeedEntry('purot:recent-changes', { wiki: page.wiki }))

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
