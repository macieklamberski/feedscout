import { definePlatformFeeds as defineFeeds } from 'feedintel'
import { t } from 'trousse'
import locales from '../../../locales.json' with { type: 'json' }
import type { DiscoverUriEntry, DiscoverUriHint, UriEntry } from '../../types.js'
import { composeHint } from '../../utils.js'

export type PlatformFeedTemplate<Key extends string = string> = {
  key: Key
  // A feed URL with `{name}` placeholders, each one host label, path segment or query value, and
  // `{scheme}` for a feed served under the page's own scheme. A template opening with `{root}`
  // takes the scheme, the host and an optional base path, as `https://example.com/forum`. A
  // `{name*}` path placeholder takes one or more segments, filled from `name` as `docs/api`. A
  // placeholder standing as a whole query parameter, as in `?{query}&format=feed`, takes a query
  // the page passes, written as given.
  template: string
  format?: DiscoverUriHint['format']
  // Another spelling of one feed, such as a legacy host, directly under the row it spells. Its
  // canonical row is the nearest row above it with the same key and format and no `isAlias`, and
  // the table throws when there is none.
  isAlias?: boolean
  // How the row's query values are written: `minimal`, the default, escapes only what would change
  // the URL's structure, and `form` encodes as `URLSearchParams` does, `:` as `%3A` and a space as
  // `+`. An alias row is written as its canonical row is.
  queryEncoding?: 'minimal' | 'form'
}

// A value left undefined is no value, so the row it would fill is skipped.
export type PlatformFeedParams = Record<string, string | undefined>

export type PlatformFeedTableOptions = {
  // The hosts a `{host}` placeholder stands for, with every host under `domains`. `getFeedHint`
  // claims a host under `domains` only for a single tenant label.
  // A pattern stands for one name across suffixes, such as `/^example\.(?:com|de)$/`, anchored at
  // both ends, and matches the host as given or without `www`.
  hosts?: Array<string | RegExp>
  // The domains a `{domain}` placeholder stands for. A pattern stands for a family of domains, such
  // as `/^blogspot\.(?:com|com\.[a-z]{2})$/`, anchored at both ends.
  domains?: Array<string | RegExp>
  // Whether `www` can be a tenant, so `www.example.com` matches a `{user}.example.com` row.
  isWwwTenant?: boolean
  // Whether `www` in front of a tenant label is dropped, so `www.alice.example.com` matches as
  // `alice.example.com`.
  isWwwTenantPrefix?: boolean
}

// A table's methods take only the keys of its rows, so a key the table does not hold fails the
// typecheck.
export type PlatformFeedTable<Key extends string = string> = {
  getFeedUrl: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => string | undefined
  getFeedEntry: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => DiscoverUriEntry | undefined
  getFeedSpellings: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => DiscoverUriEntry | undefined
  getFeedHint: (url: string) => DiscoverUriHint | undefined
  forUrl: (
    url: string,
  ) => Pick<PlatformFeedTable<Key>, 'getFeedUrl' | 'getFeedEntry' | 'getFeedSpellings'> | undefined
}

// A feedintel table, written out here, since the build reads no types from a package that ships
// its source.
type UnlabelledHint = Omit<DiscoverUriHint, 'label'>

type UnlabelledEntry = {
  uri: UriEntry
  hint: UnlabelledHint
}

type UnlabelledFeedTable<Key extends string> = {
  getFeedUrl: PlatformFeedTable<Key>['getFeedUrl']
  getFeedEntry: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => UnlabelledEntry | undefined
  getFeedSpellings: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
  ) => UnlabelledEntry | undefined
  getFeedHint: (url: string) => UnlabelledHint | undefined
  forUrl: (
    url: string,
  ) =>
    | Pick<UnlabelledFeedTable<Key>, 'getFeedUrl' | 'getFeedEntry' | 'getFeedSpellings'>
    | undefined
}

type UnlabelledFeed<Key extends string> = {
  key: Key
  main: string
  aliases: Array<string>
  format?: DiscoverUriHint['format']
  queryEncoding?: 'minimal' | 'form'
}

// A feedintel hint carries no label, since the labels are this package's.
export const withHintLabel = (hint: UnlabelledHint | undefined): DiscoverUriHint | undefined => {
  if (!hint) {
    return
  }

  return composeHint(hint.key, hint.format)
}

const withEntryLabel = (entry: UnlabelledEntry | undefined): DiscoverUriEntry | undefined => {
  if (!entry) {
    return
  }

  return { uri: entry.uri, hint: composeHint(entry.hint.key, entry.hint.format) }
}

export const withHintLabels = <Key extends string>(
  table: UnlabelledFeedTable<Key>,
): PlatformFeedTable<Key> => {
  return {
    getFeedUrl: table.getFeedUrl,
    getFeedEntry: (key, params, format) => {
      return withEntryLabel(table.getFeedEntry(key, params, format))
    },
    getFeedSpellings: (key, params, format) => {
      return withEntryLabel(table.getFeedSpellings(key, params, format))
    },
    getFeedHint: (url) => withHintLabel(table.getFeedHint(url)),
    forUrl: (url) => {
      const pageTable = table.forUrl(url)

      if (!pageTable) {
        return
      }

      return {
        getFeedUrl: pageTable.getFeedUrl,
        getFeedEntry: (key, params, format) => {
          return withEntryLabel(pageTable.getFeedEntry(key, params, format))
        },
        getFeedSpellings: (key, params, format) => {
          return withEntryLabel(pageTable.getFeedSpellings(key, params, format))
        },
      }
    },
  }
}

// One table of a handler's feed URLs, keyed by hint key. `getFeedUrl` writes a feed from the values
// a page gave, `getFeedEntry` adds its hint, `getFeedSpellings` lists every spelling of the feed
// under one hint, and `getFeedHint` reads a URL back to the feed's hint.
export const definePlatformFeeds = <const Key extends string>(
  templates: Array<PlatformFeedTemplate<Key>>,
  { domains, ...options }: PlatformFeedTableOptions = {},
): PlatformFeedTable<Key> => {
  // feedintel writes a feed as one row with its aliases.
  const feeds: Array<UnlabelledFeed<Key>> = []

  for (const { key, template, format, isAlias, queryEncoding } of templates) {
    if (!isAlias) {
      feeds.push({ key, main: template, aliases: [], format, queryEncoding })
      continue
    }

    const feed = feeds.findLast((candidate) => candidate.key === key && candidate.format === format)

    if (!feed) {
      throw new Error(t(locales.errors.missingCanonicalFeedTemplate, { key }))
    }

    feed.aliases.push(template)
  }

  return withHintLabels(defineFeeds(feeds, { ...options, tenantDomains: domains }))
}
