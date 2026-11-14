import { decodeSegment, isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  definePlatformFeeds,
  type PlatformFeedTable,
  type PlatformFeedTemplate,
} from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

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

// The feeds of a journal on the LiveJournal engine, from its root: its own subdomain, as
// `https://alice.livejournal.com`, or the path the users host serves it under, as
// `https://users.livejournal.com/-alice-`. A tag's feeds keep their own rows, so the posts row,
// which ignores extra query parameters, does not read one as posts.
const getJournalTemplates = (platform: string): Array<PlatformFeedTemplate> => {
  return [
    { key: `${platform}:posts-tag`, template: '{root}/data/rss?tag={tag}', format: 'rss' },
    { key: `${platform}:posts-tag`, template: '{root}/data/atom?tag={tag}', format: 'atom' },
    { key: `${platform}:posts`, template: '{root}/data/rss', format: 'rss' },
    { key: `${platform}:posts`, template: '{root}/data/atom', format: 'atom' },
    { key: `${platform}:userpics`, template: '{root}/data/userpics', format: 'atom' },
  ]
}

const feeds = definePlatformFeeds(getJournalTemplates('livejournal'), { domains })

// A `{root}` row claims a feed on a journal's subdomain, so the feeds the users or community host
// serves under a journal's path are claimed by their own rows.
const pathFeeds = definePlatformFeeds(
  [
    {
      key: 'livejournal:posts-tag',
      template: '{scheme}://{host}/{journal}/data/rss?tag={tag}',
      format: 'rss',
    },
    {
      key: 'livejournal:posts-tag',
      template: '{scheme}://{host}/{journal}/data/atom?tag={tag}',
      format: 'atom',
    },
    { key: 'livejournal:posts', template: '{scheme}://{host}/{journal}/data/rss', format: 'rss' },
    {
      key: 'livejournal:posts',
      template: '{scheme}://{host}/{journal}/data/atom',
      format: 'atom',
    },
    {
      key: 'livejournal:userpics',
      template: '{scheme}://{host}/{journal}/data/userpics',
      format: 'atom',
    },
  ],
  { hosts: legacyUserHosts },
)

// The feeds of a journal from its root, plus a tag's feeds on a tag page.
const getJournalEntries = (
  table: Pick<PlatformFeedTable, 'getFeedEntry'>,
  root: string,
  tag: string | undefined,
  platform: string,
): Array<DiscoverUriEntry> => {
  if (tag) {
    const params = { root, tag: decodeSegment(tag) ?? tag }

    return [
      table.getFeedEntry(`${platform}:posts-tag`, params, 'rss'),
      table.getFeedEntry(`${platform}:posts-tag`, params, 'atom'),
      table.getFeedEntry(`${platform}:posts`, params, 'rss'),
      table.getFeedEntry(`${platform}:posts`, params, 'atom'),
      table.getFeedEntry(`${platform}:userpics`, params, 'atom'),
    ]
  }

  return [
    table.getFeedEntry(`${platform}:posts`, { root }, 'rss'),
    table.getFeedEntry(`${platform}:posts`, { root }, 'atom'),
    table.getFeedEntry(`${platform}:userpics`, { root }, 'atom'),
  ]
}

// Dreamwidth and InsaneJournal run the LiveJournal engine, so a journal on any of them serves
// the same feeds, plus a tag's feeds on a tag page.
export const getJournalFeeds = (
  base: string,
  tag: string | undefined,
  platform: string,
): Array<DiscoverUriEntry> => {
  return getJournalEntries(definePlatformFeeds(getJournalTemplates(platform)), base, tag, platform)
}

// Journal names on the LiveJournal engine carry no dots, so a dotted segment such as robots.txt is
// a file of the site.
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

// A journal on its own subdomain, which the parser checked, keeps the page's origin. A user named
// in the path is canonicalised to its subdomain, with `_` written as `-`. A name that starts or
// ends with `_` makes no valid host label, so it stays on users.livejournal.com.
const getJournalRoot = (url: string, username: string | undefined): string | undefined => {
  if (!username) {
    return new URL(url).origin
  }

  const label = username.replaceAll('_', '-')

  if (label.startsWith('-') || label.endsWith('-')) {
    return `https://users.livejournal.com/${label}`
  }

  return getHostOrigin(`${label}.livejournal.com`)
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

    const page = feeds.forUrl(url)
    const root = getJournalRoot(url, parsed.username)

    if (!page || !root) {
      return []
    }

    return getJournalEntries(page, root, parsed.tag, 'livejournal')
  },

  // The table reads any label or first segment as a journal, so the page parser refuses the mobile,
  // syndication and image hosts and a dotted name first.
  getFeedHint: (url) => {
    if (!parseLivejournalUrl(url)) {
      return
    }

    return feeds.getFeedHint(url) ?? pathFeeds.getFeedHint(url)
  },
}
