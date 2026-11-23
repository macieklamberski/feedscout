import type { DiscoverUriEntry, DiscoverUriHint, UriEntry } from '../../types.js'
import { composeHint } from '../../utils.js'

// A value left undefined is no value, so the row it would fill is skipped.
export type PlatformFeedParams = Record<string, string | undefined>

// A table's methods take only the keys of its feeds, so a key the table does not hold fails the
// typecheck.
export type PlatformFeedTable<Key extends string = string> = {
  getFeedUrl: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
    variant?: string,
  ) => string | undefined
  getFeedEntry: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
    variant?: string,
  ) => DiscoverUriEntry | undefined
  getFeedSpellings: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
    variant?: string,
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
  platform: string
  rows: Array<{ key: string }>
  getFeedUrl: PlatformFeedTable<Key>['getFeedUrl']
  getFeedEntry: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
    variant?: string,
  ) => UnlabelledEntry | undefined
  getFeedSpellings: (
    key: Key,
    params?: PlatformFeedParams,
    format?: DiscoverUriHint['format'],
    variant?: string,
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

// The hint key of every feed of every table defined, so a test can ask each for its label.
export const hintKeys = new Set<string>()

export const withHintLabels = <Key extends string>(
  table: UnlabelledFeedTable<Key>,
): PlatformFeedTable<Key> => {
  for (const row of table.rows) {
    hintKeys.add(`${table.platform}:${row.key}`)
  }

  return {
    getFeedUrl: table.getFeedUrl,
    getFeedEntry: (key, params, format, variant) => {
      return withEntryLabel(table.getFeedEntry(key, params, format, variant))
    },
    getFeedSpellings: (key, params, format, variant) => {
      return withEntryLabel(table.getFeedSpellings(key, params, format, variant))
    },
    getFeedHint: (url) => withHintLabel(table.getFeedHint(url)),
    forUrl: (url) => {
      const pageTable = table.forUrl(url)

      if (!pageTable) {
        return
      }

      return {
        getFeedUrl: pageTable.getFeedUrl,
        getFeedEntry: (key, params, format, variant) => {
          return withEntryLabel(pageTable.getFeedEntry(key, params, format, variant))
        },
        getFeedSpellings: (key, params, format, variant) => {
          return withEntryLabel(pageTable.getFeedSpellings(key, params, format, variant))
        },
      }
    },
  }
}
