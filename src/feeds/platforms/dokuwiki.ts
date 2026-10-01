import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers namespace.

const namespaceRegex = /var NS='([^']+)'/
const sessionCookiePathRegex = /(?:^|,)\s*DokuWiki=[^,]*?;\s*path=([^;,\s]+)/i

export const isDokuwikiHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('DokuWiki')
}

// The core template prints the install root as `<link rel="start">`, and the session cookie is
// scoped to it unless the `cookiedir` option moves it.
const getInstallPath = (url: string, content?: string, headers?: Headers): string => {
  const startLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'start'
  })

  if (startLink?.attribs.href) {
    return new URL(startLink.attribs.href, url).pathname
  }

  return headers?.get('set-cookie')?.match(sessionCookiePathRegex)?.[1] ?? '/'
}

export const dokuwikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isDokuwikiHeaders })
  },

  resolve: (url, content, headers) => {
    const { origin } = new URL(url)
    const feedUrl = `${origin}${getInstallPath(url, content, headers)}feed.php`
    // The core template prints the page's namespace as `var NS`, whatever the URL rewriting.
    const namespace = content?.match(namespaceRegex)?.[1]
    const uris: Array<DiscoverUriEntry> = []

    if (namespace) {
      uris.push({
        uri: `${feedUrl}?${new URLSearchParams({ ns: namespace })}`,
        hint: composeHint('dokuwiki:namespace'),
      })
      // The template advertises this one: the namespace's pages, not its changes.
      uris.push({
        uri: `${feedUrl}?${new URLSearchParams({ mode: 'list', ns: namespace })}`,
        hint: composeHint('dokuwiki:namespace-pages'),
      })
    }

    uris.push({ uri: feedUrl, hint: composeHint('dokuwiki:recent-changes') })

    return uris
  },
}
