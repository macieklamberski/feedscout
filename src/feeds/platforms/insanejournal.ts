import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds, type PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'
import { getJournalName, getJournalTag } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts, userpics.

export type InsanejournalUrl =
  | { kind: 'journal'; username?: string; tag?: string }
  | { kind: 'asylum'; asylum: string; tag?: string }
  | { kind: 'syndicated'; feed: string; tag?: string }

const domains = ['insanejournal.com']
const wwwHosts = ['www.insanejournal.com', 'insanejournal.com']
const asylumHosts = ['asylums.insanejournal.com']
const feedHosts = ['feeds.insanejournal.com']
// A journal whose name makes no host label, such as `_jems_`, is served here by path, and its
// subdomain redirects here.
const userHosts = ['users.insanejournal.com']
// The hosts that name a journal by the first path segment, so a feed there sits under that name.
const pathHosts = [...asylumHosts, ...feedHosts, ...userHosts]

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/i
const wwwAsylumPathRegex = /^\/(?:asylum|community)\/([^/]+)/i
const firstSegmentRegex = /^\/([^/]+)/

const journalFeeds = definePlatformFeeds(
  [
    { key: 'insanejournal:posts-tag', main: '{scheme}://{host}/data/rss?tag={tag}', format: 'rss' },
    {
      key: 'insanejournal:posts-tag',
      main: '{scheme}://{host}/data/atom?tag={tag}',
      format: 'atom',
    },
    { key: 'insanejournal:posts', main: '{scheme}://{host}/data/rss', format: 'rss' },
    { key: 'insanejournal:posts', main: '{scheme}://{host}/data/atom', format: 'atom' },
    { key: 'insanejournal:userpics', main: '{scheme}://{host}/data/userpics', format: 'atom' },
  ],
  { hosts: { tenants: domains } },
)
const pathFeeds = definePlatformFeeds(
  [
    {
      key: 'insanejournal:posts-tag',
      main: '{scheme}://{host}/{journal}/data/rss?tag={tag}',
      format: 'rss',
    },
    {
      key: 'insanejournal:posts-tag',
      main: '{scheme}://{host}/{journal}/data/atom?tag={tag}',
      format: 'atom',
    },
    { key: 'insanejournal:posts', main: '{scheme}://{host}/{journal}/data/rss', format: 'rss' },
    { key: 'insanejournal:posts', main: '{scheme}://{host}/{journal}/data/atom', format: 'atom' },
    {
      key: 'insanejournal:userpics',
      main: '{scheme}://{host}/{journal}/data/userpics',
      format: 'atom',
    },
  ],
  { hosts: { exact: pathHosts } },
)

export const parseInsanejournalUrl = (url: string): InsanejournalUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  if (isHostOf(url, wwwHosts)) {
    const username = getJournalName(pathname, wwwUsersPathRegex)

    if (username) {
      return { kind: 'journal', username, tag: getJournalTag(pathname, wwwUsersPathRegex) }
    }

    const asylum = getJournalName(pathname, wwwAsylumPathRegex)

    if (asylum) {
      return { kind: 'asylum', asylum, tag: getJournalTag(pathname, wwwAsylumPathRegex) }
    }

    return
  }

  if (isHostOf(url, asylumHosts)) {
    const asylum = getJournalName(pathname, firstSegmentRegex)

    if (!asylum) {
      return
    }

    return { kind: 'asylum', asylum, tag: getJournalTag(pathname, firstSegmentRegex) }
  }

  if (isHostOf(url, feedHosts)) {
    const feed = getJournalName(pathname, firstSegmentRegex)

    if (!feed) {
      return
    }

    return { kind: 'syndicated', feed, tag: getJournalTag(pathname, firstSegmentRegex) }
  }

  if (isHostOf(url, userHosts)) {
    const username = getJournalName(pathname, firstSegmentRegex)

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag: getJournalTag(pathname, firstSegmentRegex) }
  }

  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'journal', tag: getJournalTag(pathname) }
}

// The InsaneJournal engine serves every journal the same feeds, plus a tag's feeds on a tag page.
const getFeeds = (
  table: Pick<typeof journalFeeds, 'getFeedEntry'>,
  params: PlatformFeedParams,
  tag: string | undefined,
): Array<DiscoverUriEntry | undefined> => {
  if (!tag) {
    return [
      table.getFeedEntry('insanejournal:posts', params, 'rss'),
      table.getFeedEntry('insanejournal:posts', params, 'atom'),
      table.getFeedEntry('insanejournal:userpics', params, 'atom'),
    ]
  }

  const tagParams = { ...params, tag: decodeSegment(tag) ?? tag }

  return [
    table.getFeedEntry('insanejournal:posts-tag', tagParams, 'rss'),
    table.getFeedEntry('insanejournal:posts-tag', tagParams, 'atom'),
    table.getFeedEntry('insanejournal:posts', params, 'rss'),
    table.getFeedEntry('insanejournal:posts', params, 'atom'),
    table.getFeedEntry('insanejournal:userpics', params, 'atom'),
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
        pathFeeds,
        { scheme: 'https', host: asylumHosts[0], journal: parsed.asylum },
        parsed.tag,
      )
    }

    if (parsed.kind === 'syndicated') {
      const pageFeeds = pathFeeds.forUrl(url)

      if (!pageFeeds) {
        return []
      }

      return getFeeds(pageFeeds, { journal: parsed.feed }, parsed.tag)
    }

    // A journal the users host serves by path keeps its feeds there.
    if (parsed.username && isHostOf(url, userHosts)) {
      const pageFeeds = pathFeeds.forUrl(url)

      if (!pageFeeds) {
        return []
      }

      return getFeeds(pageFeeds, { journal: parsed.username }, parsed.tag)
    }

    const journalUrl = parsed.username ? getHostOrigin(`${parsed.username}.insanejournal.com`) : url

    if (!journalUrl) {
      return []
    }

    const journalPageFeeds = journalFeeds.forUrl(journalUrl)

    if (!journalPageFeeds) {
      return []
    }

    return getFeeds(journalPageFeeds, {}, parsed.tag)
  },

  // A path host names the journal in the first segment, so its root `/data/rss` is no feed: the
  // asylums host redirects it to the asylum `data`. A dotted first segment is a file of the site.
  getFeedHint: (url) => {
    const pathname = parseUrl(url)?.pathname

    if (!pathname) {
      return
    }

    if (isHostOf(url, pathHosts)) {
      if (!getJournalName(pathname, firstSegmentRegex)) {
        return
      }

      return pathFeeds.getFeedHint(url)
    }

    return journalFeeds.getFeedHint(url)
  },
}
