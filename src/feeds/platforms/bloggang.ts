import { getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggangUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'post'; username: string }
  | { kind: 'diary'; username: string }

const domains = ['bloggang.com']
const hosts = ['bloggang.com', 'www.bloggang.com']
// The mobile site names a blog in the query, in a form no feed URL is built from.
const mobileHosts = ['m.bloggang.com']

const scriptRegex = /^\/(\w+)\.php$/i

const feeds = definePlatformFeeds([{ key: 'bloggang:posts', template: '{scheme}://{host}/rss' }], {
  domains,
})

export const parseBloggangUrl = (url: string): BloggangUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

  // {user}.bloggang.com answers every path with a redirect to the blog on www.
  if (subdomain && !isHostOf(url, mobileHosts)) {
    return { kind: 'blog', username: subdomain }
  }

  if (!isHostOf(url, hosts)) {
    return
  }

  const parsed = parseUrl(url)
  const script = parsed?.pathname.match(scriptRegex)?.[1]
  const username = parsed ? getQueryParam(parsed.searchParams, 'id') : undefined

  if (!username || !wordOrHyphenRegex.test(username)) {
    return
  }

  if (isAnyOf(script, 'mainblog')) {
    return { kind: 'blog', username }
  }

  if (isAnyOf(script, 'viewblog')) {
    return { kind: 'post', username }
  }

  if (isAnyOf(script, 'viewdiary')) {
    return { kind: 'diary', username }
  }
}

export const bloggangHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggangUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggangUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // A page on www names the blog in its query, so the feed host is built from the username.
    return [page.getFeedEntry('bloggang:posts', { host: `${parsed.username}.bloggang.com` })]
  },

  // m.bloggang.com/rss redirects to www.bloggang.com/rss/, so only a blog host serves a feed.
  getFeedHint: (url) => {
    if (!parseBloggangUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
