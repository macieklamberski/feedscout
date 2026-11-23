import { insanejournal } from 'feedintel'
import { decodeSegment } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PlatformFeedParams, withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts, userpics.

export type InsanejournalUrl =
  | { kind: 'journal'; username?: string; tag?: string }
  | { kind: 'asylum'; asylum: string; tag?: string }
  | { kind: 'syndicated'; feed: string; tag?: string }

const asylumHosts = ['asylums.insanejournal.com']

const feeds = withHintLabels(insanejournal.feeds)

export const parseInsanejournalUrl = (url: string): InsanejournalUrl | undefined => {
  const page = insanejournal.pages.read(url)

  if (!page) {
    return
  }

  const { journal, tag } = page.params

  if (page.key === 'asylum') {
    return { kind: 'asylum', asylum: journal, tag }
  }

  if (page.key === 'syndicated') {
    return { kind: 'syndicated', feed: journal, tag }
  }

  if (page.key === 'journal') {
    return { kind: 'journal', tag }
  }

  return { kind: 'journal', username: journal, tag }
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

  const tagParams = { ...params, tag: decodeSegment(tag) ?? tag }

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

    // An asylum named on www lives on the asylums host.
    if (parsed.kind === 'asylum') {
      return getFeeds(
        feeds,
        { scheme: 'https', host: asylumHosts[0], journal: parsed.asylum },
        parsed.tag,
      )
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

    const journalUrl = parsed.username ? getHostOrigin(`${parsed.username}.insanejournal.com`) : url

    if (!journalUrl) {
      return []
    }

    const journalPageFeeds = feeds.forUrl(journalUrl)

    if (!journalPageFeeds) {
      return []
    }

    return getFeeds(journalPageFeeds, {}, parsed.tag)
  },

  getFeedHint: feeds.getFeedHint,
}
