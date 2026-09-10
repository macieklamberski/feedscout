import { Parser } from 'htmlparser2'
import { getPathSegments, parseUrl } from 'trousse'
import type { UriEntry } from '../../types.js'

const ipAddressRegex = /^\d+\.\d+\.\d+\.\d+$/

const resolveUri = (uri: string, base: string, origin: string, pathname: string): string => {
  if (uri.startsWith('/')) {
    return `${origin}${uri}`
  }

  if (uri.startsWith('?')) {
    return `${origin}${pathname}${uri}`
  }

  return new URL(uri, base).href
}

export const generateUrlCombinations = (
  baseUrls: Array<string>,
  uris: Array<UriEntry>,
): Array<UriEntry> => {
  return baseUrls.flatMap((base) => {
    const parsed = new URL(base)
    const origin = parsed.origin
    const pathname = parsed.pathname

    return uris.map((uri) => {
      if (typeof uri === 'string') {
        return resolveUri(uri, base, origin, pathname)
      }

      return uri.map((alternative) => resolveUri(alternative, base, origin, pathname))
    })
  })
}

// Unlike resolveUri, a leading slash anchors at the base's directory instead of the origin:
// /feed.xml + https://example.com/blog/ → https://example.com/blog/feed.xml.
const resolvePathUri = (uri: string, base: string): string => {
  if (uri.startsWith('/')) {
    return new URL(uri.slice(1), base).href
  }

  return new URL(uri, base).href
}

// Resolves every URI against each base's directory: query URIs append to the directory
// (?feed=rss → /blog/?feed=rss) and array alternatives stay paired, same as at origin level.
export const generatePathUrlCombinations = (
  pathBases: Array<string>,
  uris: Array<UriEntry>,
): Array<UriEntry> => {
  return pathBases.flatMap((base) => {
    const normalizedBase = base.endsWith('/') ? base : `${base}/`

    return uris.map((uri) => {
      if (typeof uri === 'string') {
        return resolvePathUri(uri, normalizedBase)
      }

      return uri.map((alternative) => resolvePathUri(alternative, normalizedBase))
    })
  })
}

// Returns the directory prefixes of the URL's pathname as absolute URLs, shallowest first,
// excluding the root, capped at maxDepth segments from the root.
export const getAncestorPathBases = (baseUrl: string, maxDepth: number): Array<string> => {
  const url = parseUrl(baseUrl)

  if (!url) {
    return []
  }

  // The first split element is always empty (pathname starts with /) and the last is either empty
  // (directory URL) or the filename, so both are dropped. The filter collapses double slashes.
  const segments = url.pathname
    .split('/')
    .slice(1, -1)
    .filter((segment) => segment !== '')
  const bases: Array<string> = []
  let base = `${url.origin}/`

  for (const segment of segments.slice(0, maxDepth)) {
    base += `${segment}/`
    bases.push(base)
  }

  return bases
}

// Scans page HTML for same-origin anchors whose path is a single section segment (e.g. /blog)
// and returns them as path bases for probing, preserving the segment's original casing.
export const extractSectionBaseUrls = (
  content: string,
  baseUrl: string,
  sectionNames: Array<string>,
): Array<string> => {
  const base = parseUrl(baseUrl)

  if (!base) {
    return []
  }

  const bases = new Set<string>()
  const parser = new Parser(
    {
      onopentag: (name, attributes) => {
        if (name !== 'a' || !attributes.href) {
          return
        }

        const url = parseUrl(attributes.href, base)

        if (!url || url.origin !== base.origin) {
          return
        }

        const segments = getPathSegments(url)
        const segment = segments.length === 1 ? segments[0] : undefined

        if (segment && sectionNames.includes(segment.toLowerCase())) {
          bases.add(`${url.origin}/${segment}/`)
        }
      },
    },
    { decodeEntities: true },
  )

  parser.write(content)
  parser.end()

  return [...bases]
}

export const getWwwCounterpart = (baseUrl: string): string => {
  const url = new URL(baseUrl)
  const port = url.port ? `:${url.port}` : ''

  // Remove www.
  if (url.hostname.startsWith('www.')) {
    return `${url.protocol}//${url.hostname.slice(4)}${port}`
  }

  // Add www.
  return `${url.protocol}//www.${url.hostname}${port}`
}

export const getSubdomainVariants = (baseUrl: string, prefixes: Array<string>): Array<string> => {
  const url = new URL(baseUrl)
  const hostname = url.hostname

  // Check if hostname is an IP address (simple check for digits and dots)
  const isIpAddress = ipAddressRegex.test(hostname)

  // Handle edge cases: localhost, IPs
  if (hostname === 'localhost' || isIpAddress) {
    return []
  }

  const hostnameParts = hostname.split('.')

  // Need at least 2 parts for a domain
  if (hostnameParts.length < 2) {
    return []
  }

  // Extract root domain (last two parts: example.com)
  const rootDomain = hostnameParts.slice(-2).join('.')
  const protocol = url.protocol
  const port = url.port ? `:${url.port}` : ''

  return prefixes.map((prefix) => {
    const hostname = prefix === '' ? rootDomain : `${prefix}.${rootDomain}`
    return `${protocol}//${hostname}${port}`
  })
}
