import { escapeRegex, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile, related (guess, html), partly covers huffduff.

export type HuffdufferUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'huffduff'; username: string; id: string }
  | { kind: 'related'; username: string; id: string }
  | { kind: 'home' }

const hosts = ['huffduffer.com', 'www.huffduffer.com']

// `/new/{format}` reads before `/{username}/{format}`, so the site-wide feed keeps its own key.
const feeds = definePlatformFeeds([
  { key: 'huffduffer:new', template: 'https://huffduffer.com/new/rss', format: 'rss' },
  { key: 'huffduffer:new', template: 'https://huffduffer.com/new/atom', format: 'atom' },
  { key: 'huffduffer:new', template: 'https://huffduffer.com/new/json', format: 'json' },
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
])

export const parseHuffdufferUrl = (url: string): HuffdufferUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, subsection] = getPathSegments(url)

  if (!username) {
    return { kind: 'home' }
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

  if (!parsed || parsed.kind === 'home') {
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

    const huffduffsFeed = feeds.getFeedEntry('huffduffer:huffduffs', { username: page.username })

    if (page.kind === 'profile') {
      return [huffduffsFeed]
    }

    const relatedFeed = feeds.getFeedEntry('huffduffer:related', {
      username: page.username,
      id: page.id,
    })

    if (page.kind === 'related') {
      return [relatedFeed]
    }

    return [relatedFeed, huffduffsFeed]
  },

  getFeedHint: (url) => {
    const [route] = getPathSegments(url)

    // `/search/rss` and `/popular/rss` are site-wide feeds, not those of a user named so.
    if (isAnyOf(route, ['search', 'popular'])) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
