import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, profile (guess, html).
// Handler needed for: hashtag, magazine, tagRedirect.

export type NoteUrl =
  | { kind: 'hashtag'; tag: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'note'; username: string }
  | { kind: 'user'; username: string }
  | { kind: 'home' }

export const hosts = ['note.com', 'note.mu']

// A hashtag page redirects to `/tag/{tag}`, and the feed stays under `/hashtag`.
const hashtagRegex = /^\/(?:hashtag|tag)\/([^/]+)/i
const magazineRegex = /^\/([^/]+)\/m\/([^/]+)/i
const noteRegex = /^\/([^/]+)\/n\/[^/]+/i

// note.mu, the old domain, redirects every feed to the same path on note.com.
const feeds = definePlatformFeeds([
  { key: 'note:featured', main: 'https://note.com/rss', aliases: ['https://note.mu/rss'] },
  {
    key: 'note:hashtag',
    main: 'https://note.com/hashtag/{tag}/rss',
    aliases: ['https://note.mu/hashtag/{tag}/rss'],
  },
  {
    key: 'note:magazine',
    main: 'https://note.com/{username}/m/{magazine}/rss',
    aliases: ['https://note.mu/{username}/m/{magazine}/rss'],
  },
  {
    key: 'note:blog',
    main: 'https://note.com/{username}/rss',
    aliases: ['https://note.mu/{username}/rss'],
  },
])

export const parseNoteUrl = (url: string): NoteUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(hashtagRegex)?.[1]

  if (tag) {
    return { kind: 'hashtag', tag }
  }

  const magazineMatch = pathname.match(magazineRegex)

  if (magazineMatch?.[1] && magazineMatch[2]) {
    return { kind: 'magazine', username: magazineMatch[1], magazine: magazineMatch[2] }
  }

  const noteUsername = pathname.match(noteRegex)?.[1]

  if (noteUsername) {
    return { kind: 'note', username: noteUsername }
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username) {
    return { kind: 'home' }
  }

  // note names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (username.includes('.')) {
    return
  }

  return { kind: 'user', username }
}

export const noteHandler: PlatformHandler = {
  match: (url) => {
    return parseNoteUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNoteUrl(url)

    if (!parsed) {
      return []
    }

    // The featured notes feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'hashtag') {
      return [
        feeds.getFeedEntry('note:hashtag', { tag: parsed.tag }),
        feeds.getFeedEntry('note:featured'),
      ]
    }

    if (parsed.kind === 'magazine') {
      return [
        feeds.getFeedEntry('note:magazine', {
          username: parsed.username,
          magazine: parsed.magazine,
        }),
        feeds.getFeedEntry('note:featured'),
      ]
    }

    // A note page leads to its author's blog feed.
    if (parsed.kind === 'note' || parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('note:blog', { username: parsed.username }),
        feeds.getFeedEntry('note:featured'),
      ]
    }

    return [feeds.getFeedEntry('note:featured')]
  },

  // The table reads any first segment as a name, so a dotted one, a file of the site, is refused
  // by the page parser first: note.com/robots.txt/rss answers 404.
  getFeedHint: (url) => {
    if (!parseNoteUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
