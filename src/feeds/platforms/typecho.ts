import { parseUrl } from 'trousse'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { definePlatformFeeds, type PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  type Element,
  findElement,
  hasMarker,
  hasMetaContent,
  isRootOfPage,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers category, home, post.

export type TypechoPage =
  | { kind: 'home'; siteUrl: string }
  | { kind: 'page'; siteUrl: string; path: string }

// Typecho serves theme and plugin assets under the site root, as in
// `https://example.com/blog/usr/themes/default/style.css`, so the asset names the root.
const assetUrlRegex = /^(?:https?:)?(?:\/\/[^/]+)?(?<rootPath>.*?)\/usr\/(?:themes|plugins)\//i
const indexScriptRegex = /^\/index\.php(?=\/|$)/i
// The home page and its pagination, `/page/2/`, whose own feed redirects to the posts feed.
const homePathRegex = /^(?:\/|\/page\/\d+\/?)?$/i
const repeatedSlashRegex = /\/\/+/g

const assetTags = ['link', 'script']
const formats: Array<DiscoverUriHint['format']> = ['rss', 'rdf', 'atom']

// A blog on any host is known only by its theme or plugin assets, which a feed URL does not carry,
// so the feeds are built under the site root and never claimed. A page path keeps its trailing
// slash, as `/archives/13/`, or its lack of one, as `/archives/13.html`, so each has its own row.
const feeds = definePlatformFeeds([
  { key: 'typecho:posts', template: '{root}/feed/', format: 'rss' },
  { key: 'typecho:posts', template: '{root}/feed/rss/', format: 'rdf' },
  { key: 'typecho:posts', template: '{root}/feed/atom/', format: 'atom' },
  { key: 'typecho:comments', template: '{root}/feed/comments/', format: 'rss' },
  { key: 'typecho:comments', template: '{root}/feed/rss/comments/', format: 'rdf' },
  { key: 'typecho:comments', template: '{root}/feed/atom/comments/', format: 'atom' },
  { key: 'typecho:page', template: '{root}/feed/{directory*}/', format: 'rss' },
  { key: 'typecho:page', template: '{root}/feed/{path*}', format: 'rss' },
  { key: 'typecho:page', template: '{root}/feed/rss/{directory*}/', format: 'rdf' },
  { key: 'typecho:page', template: '{root}/feed/rss/{path*}', format: 'rdf' },
  { key: 'typecho:page', template: '{root}/feed/atom/{directory*}/', format: 'atom' },
  { key: 'typecho:page', template: '{root}/feed/atom/{path*}', format: 'atom' },
])

const getAssetUrl = (element: Element): string => {
  return element.attribs.href ?? element.attribs.src ?? ''
}

const findAsset = (content: string | undefined): Element | undefined => {
  return findElement(content, (element) => {
    return assetTags.includes(element.name) && assetUrlRegex.test(getAssetUrl(element))
  })
}

export const isTypechoHtml = (content: string): boolean => {
  return findAsset(content) !== undefined
}

export const getTypechoPage = (
  url: string,
  content: string | undefined,
): TypechoPage | undefined => {
  const asset = findAsset(content)
  const assetUrl = asset ? parseUrl(getAssetUrl(asset), url) : undefined
  const rootPath = assetUrl?.pathname.match(assetUrlRegex)?.groups?.rootPath

  if (!content || !assetUrl || rootPath === undefined) {
    return
  }

  const { origin, pathname } = new URL(url)
  // A site can load its theme from a second domain of its own, and the generator tag still names
  // the page as Typecho.
  const rootOrigin = hasMetaContent(content, 'generator', 'Typecho') ? origin : assetUrl.origin

  if (!isRootOfPage(`${rootOrigin}${rootPath}`, url)) {
    return
  }

  const siteUrl = `${origin}${rootPath}`
  // A site without URL rewriting routes every page through `/index.php`. A doubled slash, as in
  // `/archives//13/`, names the same page as a single one.
  const path = pathname
    .slice(rootPath.length)
    .replace(indexScriptRegex, '')
    .replace(repeatedSlashRegex, '/')

  if (homePathRegex.test(path)) {
    return { kind: 'home', siteUrl }
  }

  return { kind: 'page', siteUrl, path }
}

const getPathParams = (path: string): PlatformFeedParams => {
  const segments = path.slice(1)

  if (segments.endsWith('/')) {
    return { directory: segments.slice(0, -1) }
  }

  return { path: segments }
}

// The `/index.php` spelling answers whether or not the site rewrites URLs, the short one only
// when it does. A site without rewriting routes every page through the script, so the script is
// the root of its feeds.
const getFeedEntries = (
  siteUrl: string,
  key: string,
  params?: PlatformFeedParams,
): Array<DiscoverUriEntry> => {
  return formats.map((format) => {
    return {
      uri: [
        feeds.getFeedUrl(key, { ...params, root: siteUrl }, format),
        feeds.getFeedUrl(key, { ...params, root: `${siteUrl}/index.php` }, format),
      ],
      hint: composeHint(key, format),
    }
  })
}

export const typechoHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isTypechoHtml })) {
      return false
    }

    return getTypechoPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getTypechoPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'home') {
      return [
        ...getFeedEntries(page.siteUrl, 'typecho:posts'),
        ...getFeedEntries(page.siteUrl, 'typecho:comments'),
      ]
    }

    return [
      ...getFeedEntries(page.siteUrl, 'typecho:page', getPathParams(page.path)),
      ...getFeedEntries(page.siteUrl, 'typecho:posts'),
      ...getFeedEntries(page.siteUrl, 'typecho:comments'),
    ]
  },
}
