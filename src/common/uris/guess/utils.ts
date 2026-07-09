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

// Keeps only plain path-style URIs (e.g. /feed.xml). Query URIs and array alternatives are
// WordPress-shaped, and WordPress serves feeds from the root, so they are skipped for path bases.
export const getPathUris = (uris: Array<UriEntry>): Array<string> => {
  return uris.filter((uri): uri is string => {
    return typeof uri === 'string' && uri.startsWith('/')
  })
}

// Resolves path-style URIs relative to each base's directory instead of the origin:
// /feed.xml + https://example.com/blog/ → https://example.com/blog/feed.xml.
export const generatePathUrlCombinations = (
  pathBases: Array<string>,
  uris: Array<string>,
): Array<string> => {
  return pathBases.flatMap((base) => {
    const normalizedBase = base.endsWith('/') ? base : `${base}/`

    return uris.map((uri) => new URL(uri.slice(1), normalizedBase).href)
  })
}

// Returns the directory prefixes of the URL's pathname as absolute URLs, shallowest first,
// excluding the root, capped at maxDepth segments from the root.
export const getAncestorPathBases = (baseUrl: string, maxDepth: number): Array<string> => {
  let url: URL

  try {
    url = new URL(baseUrl)
  } catch {
    return []
  }

  // Directory of the URL: pathname up to and including the last slash.
  const directory = url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1)
  const segments = directory.split('/').filter((segment) => segment !== '')

  return segments.slice(0, maxDepth).map((_, index) => {
    return `${url.origin}/${segments.slice(0, index + 1).join('/')}/`
  })
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
