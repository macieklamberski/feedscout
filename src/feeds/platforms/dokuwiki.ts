import { dokuwiki } from 'feedintel'
import { getOrigin, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: namespace-pages, recent-changes.
// Handler needed for: namespace.

export type DokuwikiPage = { installPath: string; namespace?: string }

const namespaceRegex = /var NS='([^']+)'/
const sessionCookiePathRegex = /(?:^|,)\s*DokuWiki=[^,]*?;\s*path=([^;,\s]+)/i

const feeds = withHintLabels(dokuwiki.feeds)

export const isDokuwikiHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('DokuWiki')
}

// The core template prints the install root as `<link rel="start">`, and the session cookie is
// scoped to it unless the `cookiedir` option moves it.
const getInstallPath = (url: string, content?: string, headers?: Headers): string => {
  const startLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'start'
  })

  const startUrl = startLink?.attribs.href ? parseUrl(startLink.attribs.href, url) : undefined

  if (startUrl) {
    return startUrl.pathname
  }

  return headers?.get('set-cookie')?.match(sessionCookiePathRegex)?.[1] ?? '/'
}

const getDokuwikiPage = (url: string, content?: string, headers?: Headers): DokuwikiPage => {
  return {
    installPath: getInstallPath(url, content, headers),
    // The core template prints the page's namespace as `var NS`, whatever the URL rewriting.
    namespace: content?.match(namespaceRegex)?.[1],
  }
}

export const dokuwikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isDokuwikiHeaders })
  },

  resolve: (url, content, headers) => {
    const origin = getOrigin(url)

    if (!origin) {
      return []
    }

    const { installPath, namespace } = getDokuwikiPage(url, content, headers)
    const root = `${origin}${installPath}`

    if (namespace) {
      return [
        feeds.getFeedEntry('namespace', { root, namespace }),
        feeds.getFeedEntry('namespace-pages', { root, namespace }),
        feeds.getFeedEntry('recent-changes', { root }),
      ]
    }

    return [feeds.getFeedEntry('recent-changes', { root })]
  },
}
