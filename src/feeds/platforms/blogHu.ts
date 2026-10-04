import { getSubdomain, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: user.

export type BlogHuUrl = { kind: 'blog' } | { kind: 'user'; userId: string }

const domains = ['blog.hu']
const hosts = ['blog.hu', 'www.blog.hu']

const userRegex = /^\/user\/(\d+)(?:\/|$)/i

// The m subdomain redirects its home page to blog.hu and answers 404 elsewhere.
const excludedSubdomains = ['m']

export const parseBlogHuUrl = (url: string): BlogHuUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const userId = parsedUrl.pathname.match(userRegex)?.[1]

    if (userId) {
      return { kind: 'user', userId }
    }

    return
  }

  const subdomain = getSubdomain(parsedUrl, domains)

  if (!subdomain || subdomain.includes('.') || isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  return { kind: 'blog' }
}

export const blogHuHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogHuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogHuUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `https://blog.hu/user/${parsed.userId}/rss`,
          hint: composeHint('blog-hu:user'),
        },
      ]
    }

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/rss2`, hint: composeHint('blog-hu:posts', 'rss') },
      { uri: `${origin}/atom`, hint: composeHint('blog-hu:posts', 'atom') },
      { uri: `${origin}/comments/rss2`, hint: composeHint('blog-hu:comments', 'rss') },
      { uri: `${origin}/comments/atom`, hint: composeHint('blog-hu:comments', 'atom') },
    ]
  },
}
