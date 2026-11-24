import { insanejournal } from 'feedintel'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PlatformFeedParams, withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts, userpics.

export type InsanejournalUrl =
  | { kind: 'journal'; username?: string; tag?: string }
  | { kind: 'asylum'; asylum: string; tag?: string }
  | { kind: 'syndicated'; feed: string; tag?: string }

const feeds = withHintLabels(insanejournal.feeds)

export const parseInsanejournalUrl = (url: string): InsanejournalUrl | undefined => {
  const page = insanejournal.pages.read(url)

  if (!page) {
    return
  }

  const { tag } = page.params

  if (page.key === 'journal') {
    return { kind: 'journal', tag }
  }

  if (page.key === 'asylum') {
    return { kind: 'asylum', asylum: page.params.journal, tag }
  }

  if (page.key === 'syndicated') {
    return { kind: 'syndicated', feed: page.params.journal, tag }
  }

  return { kind: 'journal', username: page.params.journal, tag }
}

// The InsaneJournal engine serves every journal the same feeds, plus a tag's feeds on a tag page.
const getFeeds = (
  table: Pick<typeof feeds, 'getFeedEntry'>,
  params: PlatformFeedParams,
  tag: string | undefined,
): Array<DiscoverUriEntry | undefined> => {
  if (!tag) {
    return [
      table.getFeedEntry('posts', params, 'rss'),
      table.getFeedEntry('posts', params, 'atom'),
      table.getFeedEntry('userpics', params, 'atom'),
    ]
  }

  const tagParams = { ...params, tag }

  return [
    table.getFeedEntry('posts-tag', tagParams, 'rss'),
    table.getFeedEntry('posts-tag', tagParams, 'atom'),
    table.getFeedEntry('posts', params, 'rss'),
    table.getFeedEntry('posts', params, 'atom'),
    table.getFeedEntry('userpics', params, 'atom'),
  ]
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

    if (parsed.kind === 'asylum') {
      return getFeeds(feeds, { asylum: parsed.asylum }, parsed.tag)
    }

    if (parsed.kind === 'syndicated') {
      const pageFeeds = feeds.forUrl(url)

      if (!pageFeeds) {
        return []
      }

      return getFeeds(pageFeeds, { journal: parsed.feed }, parsed.tag)
    }

    // A journal the users host serves by path keeps its feeds there.
    if (insanejournal.pages.read(url)?.key === 'usersJournal') {
      const pageFeeds = feeds.forUrl(url)

      if (!pageFeeds) {
        return []
      }

      return getFeeds(pageFeeds, { journal: parsed.username }, parsed.tag)
    }

    // A journal named on www keeps the page's scheme on its own subdomain.
    if (parsed.username) {
      const scheme = new URL(url).protocol.slice(0, -1)

      return getFeeds(feeds, { scheme, journal: parsed.username }, parsed.tag)
    }

    const journalPageFeeds = feeds.forUrl(url)

    if (!journalPageFeeds) {
      return []
    }

    return getFeeds(journalPageFeeds, {}, parsed.tag)
  },

  getFeedHint: feeds.getFeedHint,
}
