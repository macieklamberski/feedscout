import { decodePercent, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
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
  | { kind: 'item'; rootUrl: string; id: string }
  | { kind: 'tag'; rootUrl: string; tag: string }
  | { kind: 'page'; rootUrl: string }

// Omeka Classic serves plugin views and core scripts from under the install root, as in
// `/biblioteca/plugins/ExhibitBuilder/views/public/css/exhibits.css`. WordPress plugins can ship
// the same `views/public/` path under `/wp-content/plugins/`, so that prefix never counts. The
// core `application/views/scripts/` path is any Zend Framework 1 layout, so only Omeka's own files
// under it count.
const assetRootRegex =
  /^((?:(?!\/wp-content\/)[^\s])*?)\/(?:plugins\/[^/\s]+\/views\/(?:public|shared)\/|application\/views\/scripts\/(?:css\/(?:public|iconfonts)\.css|javascripts\/globals\.js))/i
const itemsBrowseRegex = /^\/items(?:\/browse)?\/?$/i
const tagBrowseRegex = /^\/items\/browse\/tag\/(?<tag>[^/]+)\/?$/i
// An item is shown on its own page or inside an exhibit, under the same id.
const itemShowRegex = /^\/(?:items\/show|exhibits\/show\/[^/]+\/item)\/(?<id>\d+)\/?$/i
const trailingSlashRegex = /\/$/

// Omeka drops these from the browse query when it prints the page's feed links.
const excludedQueryParams = ['page', 'submit_search', 'output']
// A sorted feed stays the items feed, so these do not make a browse query a filter either.
const sortQueryParams = ['sort_dir', 'sort_field']

const domains = ['omeka.net']

// A site on a custom domain is known only by its marker, so its feeds are built in resolve, under
// the install root the page gives, and claimed only on Omeka's own domain. A browse query other
// than the dropped parameters makes a feed the filtered items one. The short `/items` route and an
// item shown inside an exhibit serve the same feeds, so they are claimed under the same keys.
const feeds = definePlatformFeeds(
  [
    {
      key: 'omeka:items',
      template: '{root}/items/browse?output=rss2',
      format: 'rss',
    },
    {
      key: 'omeka:items',
      template: '{root}/items/browse?output=atom',
      format: 'atom',
    },
    {
      key: 'omeka:items',
      template: '{root}/items?output=rss2',
      format: 'rss',
    },
    {
      key: 'omeka:items',
      template: '{root}/items?output=atom',
      format: 'atom',
    },
    // A site whose homepage is the items browse serves the items feed at its root too, and the
    // browse serves it page by page.
    {
      key: 'omeka:items',
      template: '{root}/?output=rss2',
      format: 'rss',
    },
    {
      key: 'omeka:items',
      template: '{root}/?output=atom',
      format: 'atom',
    },
    {
      key: 'omeka:items',
      template: '{root}/items/browse/{page}?output=rss2',
      format: 'rss',
    },
    {
      key: 'omeka:items',
      template: '{root}/items/browse/{page}?output=atom',
      format: 'atom',
    },
    {
      key: 'omeka:filtered-items',
      template: '{root}/items/browse/tag/{tag}?output=rss2',
      format: 'rss',
    },
    {
      key: 'omeka:filtered-items',
      template: '{root}/items/browse/tag/{tag}?output=atom',
      format: 'atom',
    },
    {
      key: 'omeka:item',
      template: '{root}/items/show/{id}?output=atom',
      format: 'atom',
    },
    {
      key: 'omeka:item',
      template: '{root}/exhibits/show/{exhibit}/item/{id}?output=atom',
      format: 'atom',
    },
  ],
  { domains },
)

const getBrowseQuery = (searchParams: URLSearchParams): string => {
  const queryParams = new URLSearchParams()

  for (const [name, value] of searchParams) {
    if (!isAnyOf(name, excludedQueryParams)) {
      queryParams.append(name, value)
    }
  }

  return queryParams.toString()
}

const hasFilter = (searchParams: URLSearchParams): boolean => {
  return [...searchParams.keys()].some((name) => {
    return !isAnyOf(name, excludedQueryParams) && !isAnyOf(name, sortQueryParams)
  })
}

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

  return assetRootRegex.exec(getAssetPath(asset))?.[1]
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
  const itemId = itemShowRegex.exec(routePath)?.groups?.id

  if (itemId) {
    return { kind: 'item', rootUrl, id: itemId }
  }

  const tag = tagBrowseRegex.exec(routePath)?.groups?.tag

  if (tag) {
    return { kind: 'tag', rootUrl, tag: decodePercent(tag) }
  }

  if (!itemsBrowseRegex.test(routePath)) {
    return { kind: 'page', rootUrl }
  }

  const query = getBrowseQuery(searchParams)

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

    if (page.kind === 'browse') {
      const browseUrl = `${page.rootUrl}/items/browse`
      const key = hasFilter(new URLSearchParams(page.query))
        ? 'omeka:filtered-items'
        : 'omeka:items'

      return [
        { uri: `${browseUrl}?${page.query}&output=rss2`, hint: composeHint(key, 'rss') },
        { uri: `${browseUrl}?${page.query}&output=atom`, hint: composeHint(key, 'atom') },
      ]
    }

    if (page.kind === 'tag') {
      return [
        feeds.getFeedEntry('omeka:filtered-items', { root: page.rootUrl, tag: page.tag }, 'rss'),
        feeds.getFeedEntry('omeka:filtered-items', { root: page.rootUrl, tag: page.tag }, 'atom'),
        feeds.getFeedEntry('omeka:items', { root: page.rootUrl }, 'rss'),
        feeds.getFeedEntry('omeka:items', { root: page.rootUrl }, 'atom'),
      ]
    }

    if (page.kind === 'item') {
      return [
        feeds.getFeedEntry('omeka:item', { root: page.rootUrl, id: page.id }, 'atom'),
        feeds.getFeedEntry('omeka:items', { root: page.rootUrl }, 'rss'),
        feeds.getFeedEntry('omeka:items', { root: page.rootUrl }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('omeka:items', { root: page.rootUrl }, 'rss'),
      feeds.getFeedEntry('omeka:items', { root: page.rootUrl }, 'atom'),
    ]
  },

  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)
    const parsedUrl = parseUrl(url)

    if (hint?.key !== 'omeka:items' || !parsedUrl || !hasFilter(parsedUrl.searchParams)) {
      return hint
    }

    return composeHint('omeka:filtered-items', hint.format)
  },
}
