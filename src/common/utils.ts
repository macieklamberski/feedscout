import { DomUtils, parseDocument } from 'htmlparser2'
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

export type Element = NonNullable<ReturnType<typeof DomUtils.findOne>>

type ParsedPage = {
  document: ReturnType<typeof parseDocument>
  metas: Array<Element>
}

let lastParsedContent: string | undefined
let lastParsedPage: ParsedPage | undefined

// Every platform handler reads the same page, so the last page is parsed once. Meta tags are
// collected up front because the content-matched handlers each look one up on every page.
const getParsedPage = (content: string): ParsedPage => {
  if (content === lastParsedContent && lastParsedPage) {
    return lastParsedPage
  }

  const document = parseDocument(content)

  lastParsedContent = content
  lastParsedPage = {
    document,
    metas: DomUtils.getElementsByTagName('meta', document),
  }

  return lastParsedPage
}

export const findElement = (
  content: string | undefined,
  test: (element: Element) => boolean,
): Element | undefined => {
  if (!content) {
    return
  }

  return DomUtils.findOne(test, getParsedPage(content).document.children) ?? undefined
}

export const findDescendant = (
  element: Element,
  test: (descendant: Element) => boolean,
): Element | undefined => {
  return DomUtils.findOne(test, element.children) ?? undefined
}

export const hasElementWithId = (content: string, id: string): boolean => {
  return DomUtils.getElementById(id, getParsedPage(content).document.children) !== null
}

// Takes any node so a test can check `element.parent`, which may be the document.
export const hasClass = (
  node: Element | Element['parent'] | undefined,
  className: string,
): boolean => {
  if (!node || !('attribs' in node)) {
    return false
  }

  return anyWordMatchesAnyOf(node.attribs.class ?? '', [className])
}

export const getScriptText = (content: string, id: string): string | undefined => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && element.attribs.id === id
  })

  if (!script) {
    return
  }

  return DomUtils.textContent(script)
}

export const getJsonLd = (content: string): Array<unknown> => {
  const scripts = DomUtils.findAll((element) => {
    return element.name === 'script' && isAnyOf(element.attribs.type ?? '', ['application/ld+json'])
  }, getParsedPage(content).document.children)
  const blocks: Array<unknown> = []

  for (const script of scripts) {
    try {
      blocks.push(JSON.parse(DomUtils.textContent(script)))
    } catch {}
  }

  return blocks
}

const isMetaWithKey = (element: Element, key: string): boolean => {
  const { name, property } = element.attribs

  if (element.attribs.content === undefined) {
    return false
  }

  return name?.toLowerCase() === key || property?.toLowerCase() === key
}

// Check if HTML contains a meta tag matching a name or property attribute with the given
// content value (case-insensitive prefix match).
export const hasMetaContent = (content: string, name: string, value: string): boolean => {
  const key = name.toLowerCase()
  const lowercasedValue = value.toLowerCase()

  return getParsedPage(content).metas.some((meta) => {
    return (
      isMetaWithKey(meta, key) && meta.attribs.content.toLowerCase().startsWith(lowercasedValue)
    )
  })
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
  const key = name.toLowerCase()

  return getParsedPage(content).metas.find((meta) => isMetaWithKey(meta, key))?.attribs.content
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
  let index = 0

  const runWorker = async (): Promise<void> => {
    while (index < items.length && !options.shouldStop?.()) {
      const item = items[index++]

      // processFn reports its own errors, so one failure does not stop the others.
      try {
        await processFn(item)
      } catch {}
    }
  }

  // A concurrency below 1 or NaN yields no workers, so nothing runs.
  const workerCount = Math.min(options.concurrency, items.length)

  await Promise.all(Array.from({ length: workerCount }, runWorker))
}
