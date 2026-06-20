import locales from './locales.json' with { type: 'json' }
import type { DiscoverUriHint, Pattern } from './types.js'

const whitespaceRegex = /\s+/

export const composeHint = (key: string): DiscoverUriHint => ({
  key,
  label: locales.hints[key as keyof typeof locales.hints],
})

// A response is only acceptable when its status is in the 2xx range. A missing
// status means the body was supplied directly (no fetch), so treat it as valid.
export const isSuccessfulStatus = (status: number | undefined): boolean => {
  return status === undefined || (status >= 200 && status < 300)
}

// Narrow to a plain object, excluding null and arrays (both report typeof 'object').
export const isObject = (value: unknown): value is object => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Coerce to a positive integer, falling back when missing or invalid (NaN, < 1, non-integer).
export const toPositiveInteger = (value: number | undefined, fallback: number): number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback
}

export const normalizeMimeType = (type: string): string => {
  return type.split(';')[0].trim().toLowerCase()
}

export const isSubdomainOf = (url: string, domains: string | Array<string>): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    const list = Array.isArray(domains) ? domains : [domains]
    return list.some((domain) => hostname.endsWith(`.${domain}`))
  } catch {}

  return false
}

export const isHostOf = (url: string, hosts: string | Array<string>): boolean => {
  try {
    const list = Array.isArray(hosts) ? hosts : [hosts]
    return isAnyOf(new URL(url).hostname, list)
  } catch {}

  return false
}

export const includesAnyOf = (
  value: string,
  patterns: Array<Pattern>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()

  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(parsedValue)
    }

    return pattern && parsedValue?.includes(pattern.toLowerCase())
  })
}

export const isAnyOf = (
  value: string,
  patterns: Array<Pattern>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()?.trim()

  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(parsedValue)
    }

    return parsedValue === pattern.toLowerCase().trim()
  })
}

export const anyWordMatchesAnyOf = (value: string, patterns: Array<Pattern>): boolean => {
  const words = value.toLowerCase().split(whitespaceRegex)

  return words.some((word) => isAnyOf(word, patterns))
}

export const endsWithAnyOf = (value: string, patterns: Array<Pattern>): boolean => {
  const lowerValue = value.toLowerCase()

  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(lowerValue)
    }

    return pattern && lowerValue.endsWith(pattern.toLowerCase())
  })
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

// Check if HTML contains a meta tag matching a name or property attribute with the given
// content value (prefix match), regardless of attribute order.
export const hasMetaContent = (content: string, name: string, value: string): boolean => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const metaTagRegex = new RegExp(
    `<meta(?=[^>]*(?:name|property)=["']${escapedName}["'])(?=[^>]*content=["']${escapedValue})`,
    'i',
  )

  return metaTagRegex.test(content)
}

export const omitEmpty = <T>(array: Array<T | null | undefined>): Array<T> => {
  const result: Array<T> = []

  for (const item of array) {
    if (item != null && item !== '') {
      result.push(item as T)
    }
  }

  return result
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
