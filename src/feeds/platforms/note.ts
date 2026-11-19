import { note } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, featured.
// Handler needed for: hashtag, magazine.

export type NoteUrl =
  | { kind: 'hashtag'; tag: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'note'; username: string }
  | { kind: 'user'; username: string }
  | { kind: 'home' }

export const hosts = note.hosts.exact

// A hashtag page redirects to `/tag/{tag}`, and the feed stays under `/hashtag`.
const hashtagRegex = /^\/(?:hashtag|tag)\/([^/]+)/i
const magazineRegex = /^\/([^/]+)\/m\/([^/]+)/i
const noteRegex = /^\/([^/]+)\/n\/[^/]+/i

const feeds = withHintLabels(note.feeds)

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
      return [feeds.getFeedEntry('hashtag', { tag: parsed.tag }), feeds.getFeedEntry('featured')]
    }

    if (parsed.kind === 'magazine') {
      return [
        feeds.getFeedEntry('magazine', {
          username: parsed.username,
          magazine: parsed.magazine,
        }),
        feeds.getFeedEntry('featured'),
      ]
    }

    // A note page leads to its author's blog feed.
    if (parsed.kind === 'note' || parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('blog', { username: parsed.username }),
        feeds.getFeedEntry('featured'),
      ]
    }

    return [feeds.getFeedEntry('featured')]
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
