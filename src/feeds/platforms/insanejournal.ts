import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJournalFeeds, journalTagRegex } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers asylum, blog, tildePath, userPath.
// Handler needed for: syndicated.

export type InsanejournalUrl =
  | { kind: 'journal'; username?: string; tag?: string }
  | { kind: 'asylum'; asylum: string; tag?: string }
  | { kind: 'syndicated'; feed: string; tag?: string }

const domains = ['insanejournal.com']
const wwwHosts = ['www.insanejournal.com', 'insanejournal.com']
const asylumHosts = ['asylums.insanejournal.com']
const feedHosts = ['feeds.insanejournal.com']

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/i
const wwwAsylumPathRegex = /^\/(?:asylum|community)\/([^/]+)/i
const firstSegmentRegex = /^\/([^/]+)/

export const parseInsanejournalUrl = (url: string): InsanejournalUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(journalTagRegex)?.[1]

  if (isHostOf(url, wwwHosts)) {
    const username = pathname.match(wwwUsersPathRegex)?.[1]

    if (username) {
      return { kind: 'journal', username, tag }
    }

    const asylum = pathname.match(wwwAsylumPathRegex)?.[1]

    if (asylum) {
      return { kind: 'asylum', asylum, tag }
    }

    return
  }

  if (isHostOf(url, asylumHosts)) {
    const asylum = pathname.match(firstSegmentRegex)?.[1]

    if (!asylum) {
      return
    }

    return { kind: 'asylum', asylum, tag }
  }

  if (isHostOf(url, feedHosts)) {
    const feed = pathname.match(firstSegmentRegex)?.[1]

    if (!feed) {
      return
    }

    return { kind: 'syndicated', feed, tag }
  }

  return { kind: 'journal', tag }
}

export const insanejournalHandler: PlatformHandler = {
  match: (url) => {
    return parseInsanejournalUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseInsanejournalUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'asylum') {
      // An asylum named on www lives on the asylums host.
      const asylumOrigin = isHostOf(url, asylumHosts) ? origin : 'https://asylums.insanejournal.com'

      return getJournalFeeds(`${asylumOrigin}/${parsed.asylum}`, parsed.tag, 'insanejournal')
    }

    if (parsed.kind === 'syndicated') {
      return getJournalFeeds(`${origin}/${parsed.feed}`, parsed.tag, 'insanejournal')
    }

    const base = parsed.username ? `https://${parsed.username}.insanejournal.com` : origin

    return getJournalFeeds(base, parsed.tag, 'insanejournal')
  },
}
