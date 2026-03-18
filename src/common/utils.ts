import locales from './locales.json' with { type: 'json' }
import type { DiscoverUriHint } from './types.js'

export const composeHint = (key: string): DiscoverUriHint => ({
  key,
  label: locales.hints[key as keyof typeof locales.hints],
})

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
  patterns: Array<string>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()
  return patterns.some((pattern) => pattern && parsedValue?.includes(pattern.toLowerCase()))
}

export const isAnyOf = (
  value: string,
  patterns: Array<string>,
  parser?: (value: string) => string,
): boolean => {
  const parsedValue = parser ? parser(value) : value?.toLowerCase()?.trim()
  return patterns.some((pattern) => parsedValue === pattern.toLowerCase().trim())
}

export const anyWordMatchesAnyOf = (value: string, patterns: Array<string>): boolean => {
  const words = value.toLowerCase().split(/\s+/)
  return words.some((word) => isAnyOf(word, patterns))
}

export const endsWithAnyOf = (value: string, patterns: Array<string>): boolean => {
  const lowerValue = value.toLowerCase()
  return patterns.some((pattern) => pattern && lowerValue.endsWith(pattern.toLowerCase()))
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

export const omitEmpty = <T>(array: Array<T | null | undefined>): Array<T> => {
  const result: Array<T> = []

  for (const item of array) {
    if (item != null && item !== '') {
      result.push(item as T)
    }
  }

  return result
}

export const normalizeUrl = (url: string, baseUrl: string | undefined): string => {
  return baseUrl ? new URL(url, baseUrl).href : url
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
  if (options.concurrency < 1) {
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
