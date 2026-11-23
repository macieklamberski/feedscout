import { huffduffer } from 'feedintel'
import { isAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: huffduffs.
// Handler needed for: new, popular, related.

export type HuffdufferUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'huffduff'; username: string; id: string }
  | { kind: 'related'; username: string; id: string }
  | { kind: 'collective'; username: string }
  | { kind: 'home' }
  | { kind: 'popular' }
  | { kind: 'search'; query?: string }

const feeds = withHintLabels(huffduffer.feeds)

export const parseHuffdufferUrl = (url: string): HuffdufferUrl | undefined => {
  const page = huffduffer.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  if (page.key === 'popular') {
    return { kind: 'popular' }
  }

  if (page.key === 'search') {
    return { kind: 'search', query: page.params.query }
  }

  const { username } = page.params

  if (page.key === 'collective') {
    return { kind: 'collective', username }
  }

  if (page.key === 'related') {
    return { kind: 'related', username, id: page.params.id }
  }

  if (page.key === 'huffduff') {
    return { kind: 'huffduff', username, id: page.params.id }
  }

  return { kind: 'profile', username }
}

export type HuffdufferPage = HuffdufferUrl

export const getHuffdufferPage = (
  url: string,
  content: string | undefined,
): HuffdufferPage | undefined => {
  const parsed = parseHuffdufferUrl(url)

  if (!parsed || parsed.kind === 'home' || parsed.kind === 'popular' || parsed.kind === 'search') {
    return parsed
  }

  // Usernames match in any case, and the page links its feeds with the account's own spelling:
  // `/bluetyson` links `/BlueTyson/rss`.
  const getLinkedUsername = (href: string | undefined): string | undefined => {
    const linked = huffduffer.pages.read(href ?? '')

    if (!linked || linked.key === 'home' || linked.key === 'popular' || linked.key === 'search') {
      return
    }

    if (!isAnyOf(linked.params.username, parsed.username)) {
      return
    }

    return linked.params.username
  }
  const link = findElement(content, (element) => {
    return getLinkedUsername(element.attribs.href) !== undefined
  })
  const username = getLinkedUsername(link?.attribs.href) ?? parsed.username

  return { ...parsed, username }
}

export const huffdufferHandler: PlatformHandler = {
  match: (url) => {
    return parseHuffdufferUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getHuffdufferPage(url, content)

    if (!page) {
      return []
    }

    // The new and popular lists need no value from the page, so every page builds them after its
    // own feeds.
    if (page.kind === 'home') {
      return [
        feeds.getFeedEntry('new', undefined, 'rss'),
        feeds.getFeedEntry('new', undefined, 'atom'),
        feeds.getFeedEntry('new', undefined, 'json'),
        feeds.getFeedEntry('popular', undefined, 'rss'),
        feeds.getFeedEntry('popular', undefined, 'atom'),
        feeds.getFeedEntry('popular', undefined, 'json'),
      ]
    }

    if (page.kind === 'popular') {
      return [
        feeds.getFeedEntry('popular', undefined, 'rss'),
        feeds.getFeedEntry('popular', undefined, 'atom'),
        feeds.getFeedEntry('popular', undefined, 'json'),
        feeds.getFeedEntry('new', undefined, 'rss'),
        feeds.getFeedEntry('new', undefined, 'atom'),
        feeds.getFeedEntry('new', undefined, 'json'),
      ]
    }

    if (page.kind === 'search') {
      if (!page.query) {
        return [
          feeds.getFeedEntry('new', undefined, 'rss'),
          feeds.getFeedEntry('new', undefined, 'atom'),
          feeds.getFeedEntry('new', undefined, 'json'),
          feeds.getFeedEntry('popular', undefined, 'rss'),
          feeds.getFeedEntry('popular', undefined, 'atom'),
          feeds.getFeedEntry('popular', undefined, 'json'),
        ]
      }

      return [
        feeds.getFeedEntry('search', { query: page.query }, 'rss'),
        feeds.getFeedEntry('search', { query: page.query }, 'atom'),
        feeds.getFeedEntry('search', { query: page.query }, 'json'),
        feeds.getFeedEntry('new', undefined, 'rss'),
        feeds.getFeedEntry('new', undefined, 'atom'),
        feeds.getFeedEntry('new', undefined, 'json'),
        feeds.getFeedEntry('popular', undefined, 'rss'),
        feeds.getFeedEntry('popular', undefined, 'atom'),
        feeds.getFeedEntry('popular', undefined, 'json'),
      ]
    }

    if (page.kind === 'collective') {
      return [
        feeds.getFeedEntry('collective', { username: page.username }, 'rss'),
        feeds.getFeedEntry('collective', { username: page.username }, 'atom'),
        feeds.getFeedEntry('collective', { username: page.username }, 'json'),
        feeds.getFeedEntry('new', undefined, 'rss'),
        feeds.getFeedEntry('new', undefined, 'atom'),
        feeds.getFeedEntry('new', undefined, 'json'),
        feeds.getFeedEntry('popular', undefined, 'rss'),
        feeds.getFeedEntry('popular', undefined, 'atom'),
        feeds.getFeedEntry('popular', undefined, 'json'),
      ]
    }

    if (page.kind === 'profile') {
      return [
        feeds.getFeedEntry('huffduffs', { username: page.username }, 'rss'),
        feeds.getFeedEntry('huffduffs', { username: page.username }, 'atom'),
        feeds.getFeedEntry('huffduffs', { username: page.username }, 'json'),
        feeds.getFeedEntry('new', undefined, 'rss'),
        feeds.getFeedEntry('new', undefined, 'atom'),
        feeds.getFeedEntry('new', undefined, 'json'),
        feeds.getFeedEntry('popular', undefined, 'rss'),
        feeds.getFeedEntry('popular', undefined, 'atom'),
        feeds.getFeedEntry('popular', undefined, 'json'),
      ]
    }

    const params = { username: page.username, id: page.id }

    if (page.kind === 'related') {
      return [
        feeds.getFeedEntry('related', params, 'rss'),
        feeds.getFeedEntry('related', params, 'atom'),
        feeds.getFeedEntry('related', params, 'json'),
        feeds.getFeedEntry('new', undefined, 'rss'),
        feeds.getFeedEntry('new', undefined, 'atom'),
        feeds.getFeedEntry('new', undefined, 'json'),
        feeds.getFeedEntry('popular', undefined, 'rss'),
        feeds.getFeedEntry('popular', undefined, 'atom'),
        feeds.getFeedEntry('popular', undefined, 'json'),
      ]
    }

    return [
      feeds.getFeedEntry('related', params, 'rss'),
      feeds.getFeedEntry('related', params, 'atom'),
      feeds.getFeedEntry('related', params, 'json'),
      feeds.getFeedEntry('huffduffs', params, 'rss'),
      feeds.getFeedEntry('huffduffs', params, 'atom'),
      feeds.getFeedEntry('huffduffs', params, 'json'),
      feeds.getFeedEntry('new', undefined, 'rss'),
      feeds.getFeedEntry('new', undefined, 'atom'),
      feeds.getFeedEntry('new', undefined, 'json'),
      feeds.getFeedEntry('popular', undefined, 'rss'),
      feeds.getFeedEntry('popular', undefined, 'atom'),
      feeds.getFeedEntry('popular', undefined, 'json'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
