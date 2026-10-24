import { isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  type Element,
  findElement,
  hasMarker,
  isRootOfPage,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OmekaPage =
  | { kind: 'browse'; rootUrl: string; query: string }
  | { kind: 'page'; rootUrl: string }

// Omeka Classic serves plugin views and core scripts from under the install root, as in
// `/biblioteca/plugins/ExhibitBuilder/views/public/css/exhibits.css`. WordPress plugins can ship
// the same `views/public/` path under `/wp-content/plugins/`, so that prefix never counts. The
// core `application/views/scripts/` path is any Zend Framework 1 layout, so only Omeka's own files
// under it count.
const assetRootRegex =
  /^((?:(?!\/wp-content\/)[^\s])*?)\/(?:plugins\/[^/\s]+\/views\/(?:public|shared)\/|application\/views\/scripts\/(?:css\/(?:public|iconfonts)\.css|javascripts\/globals\.js))/
const itemsBrowseRegex = /^\/items(?:\/browse)?\/?$/i
const trailingSlashRegex = /\/$/

// Omeka drops these from the browse query when it prints the page's feed links.
const excludedQueryParams = ['page', 'submit_search', 'output']

const getAssetPath = (element: Element): string => {
  if (element.name === 'link') {
    return element.attribs.href ?? ''
  }

  if (element.name === 'script') {
    return element.attribs.src ?? ''
  }

  return ''
}

const getAssetRoot = (content: string | undefined): string | undefined => {
  const asset = findElement(content, (element) => assetRootRegex.test(getAssetPath(element)))

  if (!asset) {
    return
  }

  return getAssetPath(asset).match(assetRootRegex)?.[1]
}

export const isOmekaHtml = (content: string): boolean => {
  return getAssetRoot(content) !== undefined
}

export const getOmekaPage = (url: string, content: string | undefined): OmekaPage | undefined => {
  const assetRoot = getAssetRoot(content)
  const assetRootUrl = assetRoot === undefined ? undefined : parseUrl(`${assetRoot}/`, url)

  if (!assetRootUrl || !isRootOfPage(assetRootUrl.href, url)) {
    return
  }

  const { origin, pathname, searchParams } = new URL(url)
  const rootPath = assetRootUrl.pathname.replace(trailingSlashRegex, '')
  const rootUrl = `${origin}${rootPath}`
  const routePath = pathname.slice(rootPath.length)

  if (!itemsBrowseRegex.test(routePath)) {
    return { kind: 'page', rootUrl }
  }

  const queryParams = new URLSearchParams()

  for (const [name, value] of searchParams) {
    if (!isAnyOf(name, excludedQueryParams)) {
      queryParams.append(name, value)
    }
  }

  const query = queryParams.toString()

  if (!query) {
    return { kind: 'page', rootUrl }
  }

  return { kind: 'browse', rootUrl, query }
}

export const omekaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isOmekaHtml })) {
      return false
    }

    return getOmekaPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getOmekaPage(url, content)

    if (!page) {
      return []
    }

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
