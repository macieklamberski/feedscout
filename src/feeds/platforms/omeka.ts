import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Omeka Classic serves plugin views and core scripts from under the install root, as in
// `/biblioteca/plugins/ExhibitBuilder/views/public/css/exhibits.css`. WordPress plugins can ship
// the same `views/public/` path under `/wp-content/plugins/`, so that prefix never counts.
const assetRootRegex =
  /["']((?:(?!\/wp-content\/)[^"'\s])*?)\/(?:plugins\/[^/"'\s]+\/views\/(?:public|shared)|application\/views\/scripts)\//
const itemsBrowseRegex = /^\/items(?:\/browse)?\/?$/i
const trailingSlashRegex = /\/$/

// Omeka drops these from the browse query when it prints the page's feed links.
const excludedQueryParams = ['page', 'submit_search', 'output']

export type OmekaPage =
  | { kind: 'browse'; rootUrl: string; query: string }
  | { kind: 'page'; rootUrl: string }

export const isOmekaHtml = (content: string): boolean => {
  return assetRootRegex.test(content)
}

export const getOmekaPage = (url: string, content?: string): OmekaPage => {
  const assetRoot = content?.match(assetRootRegex)?.[1] ?? ''
  const { origin, pathname, searchParams } = new URL(url)
  const rootPath = new URL(`${assetRoot}/`, url).pathname.replace(trailingSlashRegex, '')
  const rootUrl = `${origin}${rootPath}`
  const routePath = pathname.slice(rootPath.length)

  if (!pathname.startsWith(rootPath) || !itemsBrowseRegex.test(routePath)) {
    return { kind: 'page', rootUrl }
  }

  for (const param of excludedQueryParams) {
    searchParams.delete(param)
  }

  const query = searchParams.toString()

  if (!query) {
    return { kind: 'page', rootUrl }
  }

  return { kind: 'browse', rootUrl, query }
}

export const omekaHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isOmekaHtml })
  },

  resolve: (url, content) => {
    const page = getOmekaPage(url, content)
    const browseUrl = `${page.rootUrl}/items/browse`

    if (page.kind === 'browse') {
      return [
        {
          uri: `${browseUrl}?${page.query}&output=rss2`,
          hint: composeHint('omeka:filtered-items', 'rss'),
        },
        {
          uri: `${browseUrl}?${page.query}&output=atom`,
          hint: composeHint('omeka:filtered-items', 'atom'),
        },
      ]
    }

    return [
      { uri: `${browseUrl}?output=rss2`, hint: composeHint('omeka:items', 'rss') },
      { uri: `${browseUrl}?output=atom`, hint: composeHint('omeka:items', 'atom') },
    ]
  },
}
