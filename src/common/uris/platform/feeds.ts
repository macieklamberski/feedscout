import { defineFeedUrls } from 'feedintel'
import type { DiscoverUriEntry, DiscoverUriHint, UriEntry } from '../../types.js'
import { composeHint } from '../../utils.js'

export type PlatformFeed<Key extends string = string> = {
  key: Key
  // The feed's URL, with `{name}` placeholders, each one host label, path segment or query value,
  // and `{scheme}` for a feed served under the page's own scheme. A URL opening with `{root}`
  // takes the scheme, the host and an optional base path, as `https://example.com/forum`. A
  // `{name*}` path placeholder takes one or more segments, filled from `name` as `docs/api`. A
  // placeholder standing as a whole query parameter, as in `?{query}&format=feed`, takes a query
  // the page passes, written as given.
  main: string
  // Other URLs that serve the same feed, such as a legacy host, written as `main` is.
  aliases?: Array<string>
  format?: DiscoverUriHint['format']
  // How the feed's query values are written: `minimal`, the default, escapes only what would
  // change the URL's structure, and `form` encodes as `URLSearchParams` does, `:` as `%3A` and a
  // space as `+`.
  queryEncoding?: 'minimal' | 'form'
}

// A value left undefined is no value, so the row it would fill is skipped.
export type PlatformFeedParams = Record<string, string | undefined>

export type PlatformFeedCheck = (value: string) => boolean

export type PlatformHosts = {
  // The exact hosts a `{host}` placeholder stands for. A pattern stands for one name across
  // suffixes, such as `/^example\.(?:com|de)$/`, anchored at both ends, and matches the host as
  // given or without `www`.
  exact?: Array<string | RegExp>
  // The domains tenants live under: a `{domain}` placeholder stands for one, and `{host}` for every
  // one-label tenant under one. A pattern stands for a family of domains, such as
  // `/^blogspot\.(?:com|com\.[a-z]{2})$/`, anchored at both ends.
  tenants?: Array<string | RegExp>
}

// Written out here, since the build reads no types from a package that ships its source.
export type PlatformFeedLenient = {
  // The placeholders whose value is read in any letter case.
  case?: Array<string>
  // A URL with or without a trailing slash.
  trailingSlash?: boolean
  // `&amp;` between query pairs read as `&`.
  ampersandEntity?: boolean
}

export type PlatformFeedTableOptions = {
  hosts?: PlatformHosts
  // Whether `www` can be a tenant, so `www.example.com` matches a `{user}.example.com` row.
  isWwwTenant?: boolean
  // Whether `www` in front of a tenant label is dropped, so `www.alice.example.com` matches as
  // `alice.example.com`.
  isWwwTenantPrefix?: boolean
  // A check per placeholder name, such as `{ locale: isLocale }`. A feed URL whose value fails its
  // check is not built, and `getFeedHint` claims no URL whose value fails it.
  checks?: Record<string, PlatformFeedCheck>
  // The parameters a feed's main URL keeps. With a list, every other parameter is dropped.
  keptParams?: Array<string>
  // The other spellings the platform reads as the same URL, each mark resting on a fetch.
  lenient?: PlatformFeedLenient
}

// A table's methods take only the keys of its feeds, so a key the table does not hold fails the
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

// One table of a platform's feed URLs, each feed keyed by its kind. A hint is keyed
// `{platform}:{kind}`, as `dailymotion:playlist`.
export const definePlatformFeeds = <const Key extends string>(
  platform: string,
  feeds: Array<PlatformFeed<Key>>,
  options: PlatformFeedTableOptions = {},
): PlatformFeedTable<Key> => {
  return withHintLabels(defineFeedUrls(platform, feeds, options))
}
