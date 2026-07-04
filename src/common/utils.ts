import { isAnyOf } from 'trousse'
import locales from './locales.json' with { type: 'json' }
import type { DiscoverUriHint } from './types.js'

export const composeHint = (key: string): DiscoverUriHint => ({
  key,
  label: locales.hints[key as keyof typeof locales.hints],
})

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

const escapeRegex = /[.*+?^${}()|[\]\\]/g

// Check if HTML contains a meta tag matching a name or property attribute with the given
// content value (prefix match), regardless of attribute order. A quick check for "content="
// followed by the value runs first; when it is missing, the page cannot match and the full
// attribute-order-independent scan is skipped.
export const hasMetaContent = (content: string, name: string, value: string): boolean => {
  const escapedValue = value.replace(escapeRegex, '\\$&')

  if (!new RegExp(`content=["']${escapedValue}`, 'i').test(content)) {
    return false
  }

  const escapedName = name.replace(escapeRegex, '\\$&')

  return new RegExp(
    `<meta(?=[^>]*(?:name|property)=["']${escapedName}["'])(?=[^>]*content=["']${escapedValue})`,
    'i',
  ).test(content)
}

const whitespaceRegex = /\s+/

// Lowercases and splits rel once, and only when it has whitespace; single-word rels skip the
// split. This avoids repeating that work for every selector.
export const matchesAnyOfLinkSelectors = (
  rel: string,
  type: string | undefined,
  selectors: Array<{ rel: string; types?: Array<string> }>,
): boolean => {
  const lowerRel = rel.toLowerCase()
  const words = whitespaceRegex.test(lowerRel) ? lowerRel.split(whitespaceRegex) : undefined

  for (const selector of selectors) {
    const selectorRel = selector.rel.toLowerCase().trim()
    let wordMatched = false

    if (words === undefined) {
      wordMatched = lowerRel === selectorRel
    } else {
      for (const word of words) {
        if (word === selectorRel) {
          wordMatched = true
          break
        }
      }
    }

    if (!wordMatched) {
      continue
    }

    if (!selector.types) {
      return true
    }

    if (isOfAllowedMimeType(type, selector.types)) {
      return true
    }
  }

  return false
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
