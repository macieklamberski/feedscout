import { composeQuery, decodeSegment, isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  definePlatformFeeds,
  type PlatformFeedParams,
  type PlatformFeedTable,
} from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, community, tag, tildePath, userPath, usersHost.

export type LivejournalUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = ['livejournal.com']
const wwwHosts = ['www.livejournal.com']
const legacyUserHosts = ['users.livejournal.com', 'community.livejournal.com']
// The mobile site and the syndication host name a journal in the path, in a form no feed URL
// is built from.
const pathHosts = ['m.livejournal.com', 'syndicated.livejournal.com']

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/i
const legacyUserPathRegex = /^\/([^/]+)/
export const journalTagRegex = /^\/tag\/([^/]+)/i

// A journal the users or community host names in the path is served there. Its tag feeds keep their
// own rows, so the posts row, which ignores extra query parameters, does not read one as posts.
const feeds = definePlatformFeeds(
  [
    {
      key: 'livejournal:posts-tag',
      template: '{scheme}://{journal}.livejournal.com/data/rss?tag={tag}',
      format: 'rss',
    },
    {
      key: 'livejournal:posts-tag',
      template: '{scheme}://{journal}.livejournal.com/data/atom?tag={tag}',
      format: 'atom',
    },
    {
      key: 'livejournal:posts-tag',
      template: 'https://{host}/{journal}/data/rss?tag={tag}',
      format: 'rss',
    },
    {
      key: 'livejournal:posts-tag',
      template: 'https://{host}/{journal}/data/atom?tag={tag}',
      format: 'atom',
    },
    {
      key: 'livejournal:posts',
      template: '{scheme}://{journal}.livejournal.com/data/rss',
      format: 'rss',
    },
    {
      key: 'livejournal:posts',
      template: '{scheme}://{journal}.livejournal.com/data/atom',
      format: 'atom',
    },
    { key: 'livejournal:posts', template: 'https://{host}/{journal}/data/rss', format: 'rss' },
    { key: 'livejournal:posts', template: 'https://{host}/{journal}/data/atom', format: 'atom' },
    {
      key: 'livejournal:userpics',
      template: '{scheme}://{journal}.livejournal.com/data/userpics',
      format: 'atom',
    },
    {
      key: 'livejournal:userpics',
      template: 'https://{host}/{journal}/data/userpics',
      format: 'atom',
    },
  ],
  { hosts: legacyUserHosts },
)

// Dreamwidth and InsaneJournal run the LiveJournal engine, so a journal on any of them serves
// the same feeds, plus a tag's feeds on a tag page.
export const getJournalFeeds = (
  base: string,
  tag: string | undefined,
  platform: string,
): Array<DiscoverUriEntry> => {
  const uris: Array<DiscoverUriEntry> = []

  if (tag) {
    const tagQuery = composeQuery({ tag: decodeSegment(tag) ?? tag })

    uris.push({
      uri: `${base}/data/rss${tagQuery}`,
      hint: composeHint(`${platform}:posts-tag`, 'rss'),
    })
    uris.push({
      uri: `${base}/data/atom${tagQuery}`,
      hint: composeHint(`${platform}:posts-tag`, 'atom'),
    })
  }

  uris.push({ uri: `${base}/data/rss`, hint: composeHint(`${platform}:posts`, 'rss') })
  uris.push({ uri: `${base}/data/atom`, hint: composeHint(`${platform}:posts`, 'atom') })
  uris.push({ uri: `${base}/data/userpics`, hint: composeHint(`${platform}:userpics`, 'atom') })

  return uris
}

// Journal names on the LiveJournal engine carry no dots, so a dotted segment such as robots.txt is a
// file of the site.
export const getJournalName = (pathname: string, regex: RegExp): string | undefined => {
  const name = pathname.match(regex)?.[1]

  if (!name || name.includes('.')) {
    return
  }

  return name
}

export const parseLivejournalUrl = (url: string): LivejournalUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(journalTagRegex)?.[1]

  // The www, users and community hosts name a journal only by a user in the path.
  if (isHostOf(url, wwwHosts)) {
    const username = getJournalName(pathname, wwwUsersPathRegex)

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag }
  }

  // Legacy users./community. hosts: the first path segment is the user.
  if (isHostOf(url, legacyUserHosts)) {
    const username = getJournalName(pathname, legacyUserPathRegex)

    if (!username) {
      return
    }

    return { kind: 'journal', username, tag }
  }

  // An image host such as `ic.pics.livejournal.com` is nested, so no journal.
  if (!getTenantSubdomain(url, domains) || isHostOf(url, pathHosts)) {
    return
  }

  return { kind: 'journal', tag }
}

// A journal on its own subdomain reads the page's scheme through `forUrl`. A user named in the path
// is canonicalised to its subdomain, with `_` written as `-`, and reads the plain table: `forUrl`
// fills `{scheme}`, so a subdomain row would win over a users host row. A name that starts or ends
// with `_` makes no valid host label, so it stays on users.livejournal.com.
const getJournalTable = (
  url: string,
  username: string | undefined,
): { table: Pick<PlatformFeedTable, 'getFeedEntry'>; params: PlatformFeedParams } | undefined => {
  if (!username) {
    const page = feeds.forUrl(url)
    const journal = getTenantSubdomain(url, domains)

    if (!page || !journal) {
      return
    }

    return { table: page, params: { journal } }
  }

  const label = username.replaceAll('_', '-')

  if (label.startsWith('-') || label.endsWith('-')) {
    return { table: feeds, params: { host: 'users.livejournal.com', journal: label } }
  }

  if (!getHostOrigin(`${label}.livejournal.com`)) {
    return
  }

  return { table: feeds, params: { scheme: 'https', journal: label } }
}

export const livejournalHandler: PlatformHandler = {
  match: (url) => {
    return parseLivejournalUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLivejournalUrl(url)

    if (!parsed) {
      return []
    }

    const journalTable = getJournalTable(url, parsed.username)

    if (!journalTable) {
      return []
    }

    const { table, params } = journalTable
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.tag) {
      const tagParams = { ...params, tag: decodeSegment(parsed.tag) ?? parsed.tag }

      uris.push(table.getFeedEntry('livejournal:posts-tag', tagParams, 'rss'))
      uris.push(table.getFeedEntry('livejournal:posts-tag', tagParams, 'atom'))
    }

    uris.push(table.getFeedEntry('livejournal:posts', params, 'rss'))
    uris.push(table.getFeedEntry('livejournal:posts', params, 'atom'))
    uris.push(table.getFeedEntry('livejournal:userpics', params, 'atom'))

    return uris
  },

  // The table reads any label or first segment as a journal, so the page parser refuses the mobile,
  // syndication and image hosts and a dotted name first.
  getFeedHint: (url) => {
    if (!parseLivejournalUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
