import { composeQuery, getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JoomlaUrl = { kind: 'view'; path: string }

// A site without search-engine friendly URLs names the view in the query, as in
// `index.php?option=com_content&view=category&id=8`.
const routingParams = ['option', 'view', 'layout', 'id', 'catid', 'Itemid', 'lang']

// A site runs on its own domain and is known only by its marker, so its feeds are built here but
// not claimed. The feed is the view's own URL with the feed format in its query, and a view
// without search-engine friendly URLs passes the routing parameters that name it.
const feeds = definePlatformFeeds('joomla', [
  { key: 'view', main: '{root}?{query}&format=feed&type=rss', format: 'rss' },
  { key: 'view', main: '{root}?format=feed&type=rss', format: 'rss' },
  { key: 'view', main: '{root}?{query}&format=feed&type=atom', format: 'atom' },
  { key: 'view', main: '{root}?format=feed&type=atom', format: 'atom' },
])

// Templates such as Helix Ultimate rewrite the generator to a string that only
// contains `Joomla!`, while every Joomla 3, 4 and 5 page ships the script options.
export const isJoomlaHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Joomla!') || content.includes('joomla-script-options')
  )
}

const getRoutingQuery = (searchParams: URLSearchParams): string | undefined => {
  if (getQueryParam(searchParams, 'option') === undefined) {
    return
  }

  const query: Record<string, string> = {}

  for (const name of routingParams) {
    const value = getQueryParam(searchParams, name)

    if (value) {
      query[name] = value
    }
  }

  return composeQuery(query)
}

export const parseJoomlaUrl = (url: string): JoomlaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  return { kind: 'view', path: parsedUrl.pathname }
}

export const joomlaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isJoomlaHtml })) {
      return false
    }

    return parseJoomlaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseJoomlaUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    const { origin, searchParams } = new URL(url)
    // The table drops one trailing slash from a root, so a view path ending in one keeps it.
    const params = { root: `${origin}${parsed.path}/`, query: getRoutingQuery(searchParams) }

    return [
      pageFeeds.getFeedEntry('view', params, 'rss'),
      pageFeeds.getFeedEntry('view', params, 'atom'),
    ]
  },
}
