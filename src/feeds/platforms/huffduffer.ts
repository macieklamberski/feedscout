import { huffduffer } from 'feedintel'
import { escapeRegex, getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

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

const hosts = huffduffer.hosts.exact

const feeds = withHintLabels(huffduffer.feeds)

export const parseHuffdufferUrl = (url: string): HuffdufferUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, subsection] = getPathSegments(url)

  if (!username) {
    return { kind: 'home' }
  }

  if (isAnyOf(username, 'popular')) {
    return { kind: 'popular' }
  }

  if (isAnyOf(username, 'search')) {
    return { kind: 'search', query: getQueryParam(parseUrl(url), 'q') }
  }

  if (isAnyOf(section, 'collective')) {
    return { kind: 'collective', username }
  }

  if (section && digitsRegex.test(section) && isAnyOf(subsection, 'related')) {
    return { kind: 'related', username, id: section }
  }

  if (section && digitsRegex.test(section)) {
    return { kind: 'huffduff', username, id: section }
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
  const usernameRegex = new RegExp(`huffduffer\\.com/(${escapeRegex(parsed.username)})/`, 'i')
  const username = content?.match(usernameRegex)?.[1] ?? parsed.username

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

  // A user row also reads `/search/rss` without a query, which is no user's feed.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key === 'huffduffer:huffduffs' && parseHuffdufferUrl(url)?.kind !== 'profile') {
      return
    }

    return hint
  },
}
