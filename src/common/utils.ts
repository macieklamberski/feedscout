import { Parser } from 'htmlparser2'
import { anyWordMatchesAnyOf, isAnyOf } from 'trousse'
import locales from './locales.json' with { type: 'json' }
import type { DiscoverUriHint } from './types.js'

export const composeHint = (key: string, format?: DiscoverUriHint['format']): DiscoverUriHint => {
  const label = locales.hints[key as keyof typeof locales.hints]

  if (!format) {
    return { key, label }
  }

  return { key, label, format }
}

// A response is only acceptable when its status is in the 2xx range. A missing
// status means the body was supplied directly (no fetch), so treat it as valid.
export const isSuccessfulStatus = (status: number | undefined): boolean => {
  return status === undefined || (status >= 200 && status < 300)
}

// Coerce to a positive integer, falling back when missing or invalid (NaN, < 1, non-integer).
export const toPositiveInteger = (value: number | undefined, fallback: number): number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback
}

export const normalizeMimeType = (type: string): string => {
  return type.split(';')[0].trim().toLowerCase()
}

export const isOfAllowedMimeType = (
  type: string | undefined,
  allowedTypes: Array<string>,
): boolean => {
  if (allowedTypes.length === 0) {
    return true
  }

  if (!type) {
    return false
  }

  return isAnyOf(type, allowedTypes, normalizeMimeType)
}

// A path segment arrives percent-encoded, so it is decoded before going into a query value.
export const decodePathSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment)
  } catch {}

  return segment
}

// Contents of every meta tag in the page, keyed by its lowercased name or property attribute.
type MetaContents = Record<string, Array<string>>

let lastParsedContent: string | undefined
let lastMetaContents: MetaContents = {}

// Every platform handler reads meta tags from the same page, so the last page is parsed once.
const getMetaContents = (content: string): MetaContents => {
  if (content === lastParsedContent) {
    return lastMetaContents
  }

  const metaContents: MetaContents = {}
  const parser = new Parser({
    onopentag: (tag, attributes) => {
      if (tag !== 'meta' || attributes.content === undefined) {
        return
      }

      for (const key of [attributes.name, attributes.property]) {
        if (!key) {
          continue
        }

        const normalizedKey = key.toLowerCase()

        metaContents[normalizedKey] ??= []
        metaContents[normalizedKey].push(attributes.content)
      }
    },
  })

  parser.write(content)
  parser.end()

  lastParsedContent = content
  lastMetaContents = metaContents

  return metaContents
}

// Check if HTML contains a meta tag matching a name or property attribute with the given
// content value (case-insensitive prefix match).
export const hasMetaContent = (content: string, name: string, value: string): boolean => {
  const contents = getMetaContents(content)[name.toLowerCase()] ?? []
  const lowercasedValue = value.toLowerCase()

  return contents.some((metaContent) => metaContent.toLowerCase().startsWith(lowercasedValue))
}

// Fetch joins every Set-Cookie header into one comma-separated value.
const cookieNameRegex = /(?:^|,)\s*([^=;,\s]+)=/g

export const getCookieNames = (headers: Headers): Array<string> => {
  const cookies = headers.get('set-cookie') ?? ''

  return Array.from(cookies.matchAll(cookieNameRegex), (match) => match[1])
}

export const hasAnyMeta = (content: string, markers: Array<[string, string]>): boolean => {
  return markers.some(([name, value]) => hasMetaContent(content, name, value))
}

// Read the content value of the first meta tag with the given name or property attribute.
export const getMetaContent = (content: string, name: string): string | undefined => {
  return getMetaContents(content)[name.toLowerCase()]?.[0]
}

export const matchesAnyOfLinkSelectors = (
  rel: string,
  type: string | undefined,
  selectors: Array<{ rel: string; types?: Array<string> }>,
): boolean => {
  return selectors.some((selector) => {
    if (!anyWordMatchesAnyOf(rel, [selector.rel])) {
      return false
    }

    if (!selector.types) {
      return true
    }

    return isOfAllowedMimeType(type, selector.types)
  })
}

export const processConcurrently = async <T>(
  items: Array<T>,
  processFn: (item: T) => Promise<void>,
  options: {
    concurrency: number
    shouldStop?: () => boolean
  },
): Promise<void> => {
  // Guard against < 1 and non-numeric (NaN) concurrency, which would otherwise
  // spin the loop forever since `active.size < NaN` is always false.
  if (!(options.concurrency >= 1)) {
    return
  }

  const active = new Set<Promise<void>>()

  let index = 0

  while (index < items.length || active.size > 0) {
    if (options.shouldStop?.()) {
      break
    }

    // Fill up active slots.
    while (active.size < options.concurrency && index < items.length) {
      const item = items[index++]

      const promise = processFn(item)
        .catch(() => {
          // Swallow errors - let processFn handle its own error logic.
        })
        .finally(() => {
          active.delete(promise)
        })

      active.add(promise)
    }

    // Wait for at least one to complete.
    if (active.size > 0) {
      await Promise.race(active)
    }
  }
}
