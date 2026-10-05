import { getSubdomain, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggangUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'post'; username: string }
  | { kind: 'diary'; username: string }

const domains = ['bloggang.com']
const hosts = ['bloggang.com', 'www.bloggang.com']

const usernameRegex = /^[\w-]+$/
const scriptRegex = /^\/(\w+)\.php$/i

const excludedSubdomains = ['m', 'www']

export const parseBloggangUrl = (url: string): BloggangUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // {user}.bloggang.com answers every path with a redirect to the blog on www.
  if (subdomain && !isAnyOf(subdomain, excludedSubdomains)) {
    if (!usernameRegex.test(subdomain)) {
      return
    }

    return { kind: 'blog', username: subdomain }
  }

  if (!isHostOf(url, hosts)) {
    return
  }

  const parsed = parseUrl(url)
  const script = parsed?.pathname.match(scriptRegex)?.[1]
  const username = parsed?.searchParams.get('id')

  if (!username || !usernameRegex.test(username)) {
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

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://${parsed.username}.bloggang.com/rss`,
        hint: composeHint('bloggang:posts'),
      },
    ]
  },
}
