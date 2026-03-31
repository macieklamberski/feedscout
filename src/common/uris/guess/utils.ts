import type { UriEntry } from '../../types.js'

const ipAddressRegex = /^\d+\.\d+\.\d+\.\d+$/

const resolveUri = (uri: string, base: string, origin: string, pathname: string): string => {
  if (uri.startsWith('/')) {
    return `${origin}${uri}`
  }

  if (uri.startsWith('?')) {
    return `${origin}${pathname}${uri}`
  }

  return new URL(uri, base).toString()
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
