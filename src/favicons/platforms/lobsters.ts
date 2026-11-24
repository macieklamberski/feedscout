import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

export type LobstersUrl =
  | { kind: 'tag'; tags: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'user'; username: string }
  | { kind: 'top'; period?: string }
  | { kind: 'newest' }
  | { kind: 'comments' }
  | { kind: 'home' }

const hosts = ['lobste.rs']

const tagRegex = /^\/t\/(?<tags>[^/]+)/i
const domainRegex = /^\/domains\/([^/]+)/i
const userRegex = /^\/~(?<username>[^/]+)/
const topRegex = /^\/top(?:\/(?<period>\d+[dwmy]))?\/?$/i
const newestRegex = /^\/newest\/?$/i
const commentsRegex = /^\/comments\/?$/i
const tagsValueRegex = /^[\w,-]+$/

export const parseLobstersUrl = (url: string): LobstersUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  // A comma joins several tags: /t/{tag1},{tag2}.
  const tags = pathname.match(tagRegex)?.groups?.tags

  if (tags && tagsValueRegex.test(tags)) {
    return { kind: 'tag', tags }
  }

  const domain = pathname.match(domainRegex)?.[1]

  if (domain) {
    return { kind: 'domain', domain }
  }

  const username = pathname.match(userRegex)?.groups?.username

  if (username && wordOrHyphenRegex.test(username)) {
    return { kind: 'user', username }
  }

  const topMatch = pathname.match(topRegex)

  // Top page, for a period or without one: /top/{period} or /top.
  if (topMatch) {
    return { kind: 'top', period: topMatch.groups?.period }
  }

  if (newestRegex.test(pathname)) {
    return { kind: 'newest' }
  }

  if (commentsRegex.test(pathname)) {
    return { kind: 'comments' }
  }

  return { kind: 'home' }
}

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return parseLobstersUrl(url)?.kind === 'user'
  },

  resolve: (url) => {
    const parsed = parseLobstersUrl(url)

    if (parsed?.kind !== 'user') {
      return []
    }

    return [{ uri: `https://lobste.rs/avatars/${parsed.username}-100.png` }]
  },
}
