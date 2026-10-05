import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers category, home, post.

export type TypechoPage =
  | { kind: 'home'; siteUrl: string }
  | { kind: 'page'; siteUrl: string; path: string }

// Typecho serves theme and plugin assets under the site root, as in
// `https://example.com/blog/usr/themes/default/style.css`, so the asset names the root.
const assetRegex =
  /<(?:link|script)\b[^>]*?\s(?:href|src)=["']?(?:https?:)?(?:\/\/[^/"'\s>]+)?([^"'\s>]*?)\/usr\/(?:themes|plugins)\//i
const indexScriptRegex = /^\/index\.php(?=\/|$)/i
// The home page and its pagination, `/page/2/`, whose own feed redirects to the posts feed.
const homePathRegex = /^(?:\/|\/page\/\d+\/?)?$/i

export const isTypechoHtml = (content: string): boolean => {
  return assetRegex.test(content)
}

export const getTypechoPage = (
  url: string,
  content: string | undefined,
): TypechoPage | undefined => {
  const rootPath = content?.match(assetRegex)?.[1]

  if (rootPath === undefined) {
    return
  }

  const { origin, pathname } = new URL(url)

  if (pathname !== rootPath && !pathname.startsWith(`${rootPath}/`)) {
    return
  }

  const siteUrl = `${origin}${rootPath}`
  // A site without URL rewriting routes every page through `/index.php`.
  const path = pathname.slice(rootPath.length).replace(indexScriptRegex, '')

  if (homePathRegex.test(path)) {
    return { kind: 'home', siteUrl }
  }

  return { kind: 'page', siteUrl, path }
}

// The `/index.php` spelling answers whether or not the site rewrites URLs, the short one only
// when it does.
const getFeedEntries = (siteUrl: string, path: string, key: string): Array<DiscoverUriEntry> => {
  return [
    {
      uri: [`${siteUrl}/feed${path}`, `${siteUrl}/index.php/feed${path}`],
      hint: composeHint(key, 'rss'),
    },
    {
      uri: [`${siteUrl}/feed/rss${path}`, `${siteUrl}/index.php/feed/rss${path}`],
      hint: composeHint(key, 'rdf'),
    },
    {
      uri: [`${siteUrl}/feed/atom${path}`, `${siteUrl}/index.php/feed/atom${path}`],
      hint: composeHint(key, 'atom'),
    },
  ]
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

    const postsEntries = [
      ...getFeedEntries(page.siteUrl, '/', 'typecho:posts'),
      ...getFeedEntries(page.siteUrl, '/comments/', 'typecho:comments'),
    ]

    if (page.kind === 'home') {
      return postsEntries
    }

    return [...getFeedEntries(page.siteUrl, page.path, 'typecho:page'), ...postsEntries]
  },
}
