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

// The wiki's changes come first, so its feeds are not read as the feeds of a page named all.
const feeds = definePlatformFeeds(
  [
    { key: 'purot:recent-changes', template: '{scheme}://{host}/changes/all?mode=rss' },
    {
      key: 'purot:recent-page-changes',
      template: '{scheme}://{host}/changes/all?mode=rss&messages=0',
    },
    {
      key: 'purot:recent-discussions',
      template: '{scheme}://{host}/changes/all?mode=rss&pages=0',
    },
    {
      key: 'purot:page-changes',
      template: '{scheme}://{host}/changes/{page}?mode=rss&messages=0',
    },
    {
      key: 'purot:page-discussions',
      template: '{scheme}://{host}/changes/{page}?mode=rss&pages=0',
    },
    { key: 'purot:page-activity', template: '{scheme}://{host}/changes/{page}?mode=rss' },
    // Only a missing user's profile page links these, with every user's profile changes in them.
    {
      key: 'purot:user-changes',
      template: '{scheme}://{host}/changes/profile/{user}?mode=rss&messages=0',
    },
    {
      key: 'purot:user-discussions',
      template: '{scheme}://{host}/changes/profile/{user}?mode=rss&pages=0',
    },
    {
      key: 'purot:user-activity',
      template: '{scheme}://{host}/changes/profile/{user}?mode=rss',
    },
  ],
  { domains },
)

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

    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'page') {
      const params = { page: page.page }

      uris.push(pageFeeds.getFeedEntry('purot:page-changes', params))
      uris.push(pageFeeds.getFeedEntry('purot:page-discussions', params))
      uris.push(pageFeeds.getFeedEntry('purot:page-activity', params))
    }

    uris.push(pageFeeds.getFeedEntry('purot:recent-changes'))

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
