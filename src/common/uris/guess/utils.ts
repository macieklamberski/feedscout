export const generateUrlCombinations = (
  baseUrls: Array<string>,
  uris: Array<string>,
): Array<string> => {
  return baseUrls.flatMap((base) => {
    return uris.map((uri) => {
      return new URL(uri, base).toString()
    })
  })
}

export const getWwwCounterpart = (baseUrl: string): string => {
  const url = new URL(baseUrl)
  const counterpart = new URL(url)

  // Remove www.
  if (url.hostname.startsWith('www.')) {
    counterpart.hostname = url.hostname.replace(/^www\./, '')
    return counterpart.origin
  }

  // Add www.
  counterpart.hostname = `www.${url.hostname}`
  return counterpart.origin
}

export const getSubdomainVariants = (baseUrl: string, prefixes: Array<string>): Array<string> => {
  const url = new URL(baseUrl)
  const hostname = url.hostname

  // Check if hostname is an IP address (simple check for digits and dots)
  const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname)

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
