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
  const page = insanejournal.pages.readUrl(url)

  if (!page) {
    return
  }

  const { tag } = page.values

  if (page.key === 'journal') {
    return { kind: 'journal', tag }
  }

  if (page.key === 'asylum') {
    return { kind: 'asylum', asylum: page.values.journal, tag }
  }

  if (page.key === 'syndicated') {
    return { kind: 'syndicated', feed: page.values.journal, tag }
  }

  return { kind: 'journal', username: page.values.journal, tag }
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

    // A page fills the host and scheme its journal's feeds sit on: the path host it names the
    // journal on, or the journal's own subdomain.
    const pageFeeds = feeds.forSite(url)

    if (!pageFeeds) {
      return []
    }

    if (parsed.kind === 'syndicated') {
      return getFeeds(pageFeeds, { journal: parsed.feed }, parsed.tag)
    }

    if (parsed.username) {
      return getFeeds(pageFeeds, { journal: parsed.username }, parsed.tag)
    }

    return getFeeds(pageFeeds, {}, parsed.tag)
  },

  getFeedHint: feeds.getFeedHint,
}
