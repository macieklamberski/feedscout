import { DomUtils, parseDocument } from 'htmlparser2'
import { anyWordMatchesAnyOf, getSubdomain, isAnyOf, parseUrl, stripWww } from 'trousse'
import locales from './locales.json' with { type: 'json' }
import type { DiscoverUriHint, FetchFn } from './types.js'

export type Element = NonNullable<ReturnType<typeof DomUtils.findOne>>

type ParsedPage = {
  document: ReturnType<typeof parseDocument>
  metas: Array<Element>
}

export type PageMarkers = {
  html?: (content: string) => boolean
  headers?: (headers: Headers) => boolean
}

export const digitsRegex = /^\d+$/
export const alphanumericOrHyphenRegex = /^[A-Za-z0-9-]+$/
export const hexRegex = /^[0-9a-f]+$/i
export const hexOrHyphenRegex = /^[0-9a-f-]+$/i
export const wordRegex = /^\w+$/
export const wordOrHyphenRegex = /^[\w-]+$/
export const letterThenWordOrHyphenRegex = /^[a-zA-Z][\w-]*$/
export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// length: keeps path words such as `history` out
export const letterPairsRegex = /^[a-z]{2}(?:-[a-z]{2})?$/i
// length: keeps path words such as `blogs` out
export const letterGroupsRegex = /^[a-z]{2,3}(?:-[a-z]{4})?(?:-[a-z]{2})?$/i
// A format extension after a value that cannot hold a dot, as `.rss` or `.html`.
export const formatSuffixRegex = /\.[a-z]+$/i

// The `id` group the regex reads from the value, when it is all digits.
export const getNumericId = (value: string | undefined, regex: RegExp): string | undefined => {
  const id = value?.match(regex)?.groups?.id

  if (id && digitsRegex.test(id)) {
    return id
  }
}

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

// A fetch function may return the body as a stream. It is read to text here, so every reader after
// the fetch function works on a string.
export const withTextBody = (fetchFn: FetchFn): FetchFn => {
  return async (url, options) => {
    const response = await fetchFn(url, options)

    if (typeof response.body === 'string') {
      return response
    }

    return {
      ...response,
      body: await new Response(response.body).text(),
    }
  }
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

// The single-slot cache would otherwise hold the last page's DOM until another page is parsed.
export const releaseParsedPage = (): void => {
  lastParsedContent = undefined
  lastParsedPage = undefined
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

export const findElements = (
  content: string,
  test: (element: Element) => boolean,
): Array<Element> => {
  return DomUtils.findAll(test, getParsedPage(content).document.children)
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
    return element.name === 'script' && isAnyOf(element.attribs.type, 'application/ld+json')
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

// A script takes path info, as in `/app.php/help/faq`, and a rewritten page is an HTML file.
const scriptSegmentRegex = /\/[^/]*\.(?:php(?:\/.*)?|html?)$/i
const trailingSlashRegex = /\/$/

// The subdomain a platform gives one of its users: a single label other than `www`, which is the
// platform's own site everywhere.
export const getTenantSubdomain = (
  url: string | URL,
  domains: Array<string>,
): string | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (!subdomain || subdomain.includes('.')) {
    return
  }

  if (isAnyOf(subdomain, 'www')) {
    return
  }

  return subdomain
}

// A URL used as a marker names the site only on the page's own host and under a root that holds
// the page.
export const isRootOfPage = (rootUrl: string, url: string): boolean => {
  const parsedRootUrl = parseUrl(rootUrl)
  const parsedUrl = parseUrl(url)

  if (!parsedRootUrl || !parsedUrl) {
    return false
  }

  if (stripWww(parsedRootUrl.hostname) !== stripWww(parsedUrl.hostname)) {
    return false
  }

  const rootPath = parsedRootUrl.pathname.replace(trailingSlashRegex, '')

  return `${parsedUrl.pathname}/`.startsWith(`${rootPath}/`)
}

// A value written into a host passes only when the parsed URL keeps it as the whole host, so
// `a@b.example` or `open/x` cuts no other host out of it, and an empty label as in `..` is refused.
export const getHostOrigin = (host: string): string | undefined => {
  const parsedUrl = parseUrl(`https://${host}`)

  if (!parsedUrl || parsedUrl.hostname !== host.toLowerCase()) {
    return
  }

  if (parsedUrl.hostname.split('.').includes('')) {
    return
  }

  return parsedUrl.origin
}

export const getScriptDirectory = (pathname: string): string => {
  return pathname.replace(scriptSegmentRegex, '').replace(trailingSlashRegex, '')
}

export const hasAnyMeta = (content: string, markers: Array<[string, string]>): boolean => {
  return markers.some(([name, value]) => hasMetaContent(content, name, value))
}

// Whether the page carries a platform's marker in its markup or its response headers.
export const hasMarker = (
  content: string | undefined,
  headers: Headers | undefined,
  markers: PageMarkers,
): boolean => {
  if (content && markers.html?.(content)) {
    return true
  }

  if (headers && markers.headers?.(headers)) {
    return true
  }

  return false
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
  processFn: (item: T, index: number) => Promise<void>,
  options: {
    concurrency: number
    shouldStop?: () => boolean
  },
): Promise<void> => {
  let index = 0

  const runWorker = async (): Promise<void> => {
    while (index < items.length && !options.shouldStop?.()) {
      const itemIndex = index++

      // processFn reports its own errors, so one failure does not stop the others.
      try {
        await processFn(items[itemIndex], itemIndex)
      } catch {}
    }
  }

  // A concurrency below 1 or NaN yields no workers, so nothing runs.
  const workerCount = Math.min(options.concurrency, items.length)

  await Promise.all(Array.from({ length: workerCount }, runWorker))
}
