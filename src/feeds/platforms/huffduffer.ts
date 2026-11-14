import { escapeRegex, getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile, related (guess, html), partly covers huffduff.

export type HuffdufferUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'huffduff'; username: string; id: string }
  | { kind: 'related'; username: string; id: string }
  | { kind: 'collective'; username: string }
  | { kind: 'home' }
  | { kind: 'popular' }
  | { kind: 'search'; query?: string }

const hosts = ['huffduffer.com', 'www.huffduffer.com']

// `/new/{format}` and `/popular/{format}` read before `/{username}/{format}`, so the site-wide
// feeds keep their own keys.
const feeds = definePlatformFeeds([
  { key: 'huffduffer:new', template: 'https://huffduffer.com/new/rss', format: 'rss' },
  { key: 'huffduffer:new', template: 'https://huffduffer.com/new/atom', format: 'atom' },
  { key: 'huffduffer:new', template: 'https://huffduffer.com/new/json', format: 'json' },
  { key: 'huffduffer:popular', template: 'https://huffduffer.com/popular/rss', format: 'rss' },
  { key: 'huffduffer:popular', template: 'https://huffduffer.com/popular/atom', format: 'atom' },
  { key: 'huffduffer:popular', template: 'https://huffduffer.com/popular/json', format: 'json' },
  {
    key: 'huffduffer:search',
    template: 'https://huffduffer.com/search/rss?q={query}',
    format: 'rss',
  },
  {
    key: 'huffduffer:search',
    template: 'https://huffduffer.com/search/atom?q={query}',
    format: 'atom',
  },
  {
    key: 'huffduffer:search',
    template: 'https://huffduffer.com/search/json?q={query}',
    format: 'json',
  },
  { key: 'huffduffer:huffduffs', template: 'https://huffduffer.com/{username}/rss', format: 'rss' },
  {
    key: 'huffduffer:huffduffs',
    template: 'https://huffduffer.com/{username}/atom',
    format: 'atom',
  },
  {
    key: 'huffduffer:huffduffs',
    template: 'https://huffduffer.com/{username}/json',
    format: 'json',
  },
  { key: 'huffduffer:related', template: 'https://huffduffer.com/{username}/{id}/related/rss' },
  {
    key: 'huffduffer:collective',
    template: 'https://huffduffer.com/{username}/collective/rss',
    format: 'rss',
  },
  {
    key: 'huffduffer:collective',
    template: 'https://huffduffer.com/{username}/collective/atom',
    format: 'atom',
  },
  {
    key: 'huffduffer:collective',
    template: 'https://huffduffer.com/{username}/collective/json',
    format: 'json',
  },
])

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

    if (page.kind === 'home') {
      return [
        feeds.getFeedEntry('huffduffer:new', undefined, 'rss'),
        feeds.getFeedEntry('huffduffer:new', undefined, 'atom'),
        feeds.getFeedEntry('huffduffer:new', undefined, 'json'),
      ]
    }

    if (page.kind === 'popular') {
      return [
        feeds.getFeedEntry('huffduffer:popular', undefined, 'rss'),
        feeds.getFeedEntry('huffduffer:popular', undefined, 'atom'),
        feeds.getFeedEntry('huffduffer:popular', undefined, 'json'),
      ]
    }

    if (page.kind === 'search') {
      if (!page.query) {
        return []
      }

      return [
        feeds.getFeedEntry('huffduffer:search', { query: page.query }, 'rss'),
        feeds.getFeedEntry('huffduffer:search', { query: page.query }, 'atom'),
        feeds.getFeedEntry('huffduffer:search', { query: page.query }, 'json'),
      ]
    }

    if (page.kind === 'collective') {
      return [
        feeds.getFeedEntry('huffduffer:collective', { username: page.username }, 'rss'),
        feeds.getFeedEntry('huffduffer:collective', { username: page.username }, 'atom'),
        feeds.getFeedEntry('huffduffer:collective', { username: page.username }, 'json'),
      ]
    }

    if (page.kind === 'profile') {
      return [feeds.getFeedEntry('huffduffer:huffduffs', { username: page.username })]
    }

    if (page.kind === 'related') {
      return [feeds.getFeedEntry('huffduffer:related', { username: page.username, id: page.id })]
    }

    return [
      feeds.getFeedEntry('huffduffer:related', { username: page.username, id: page.id }),
      feeds.getFeedEntry('huffduffer:huffduffs', { username: page.username }),
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
