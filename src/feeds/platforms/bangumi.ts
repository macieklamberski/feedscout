import { encodePathSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (html), partly covers user.

export type BangumiUrl = { kind: 'user'; username: string } | { kind: 'home' }

const hosts = ['bgm.tv', 'bangumi.tv']

const userRegex = /^\/user\/([^/]+)/i

export const parseBangumiUrl = (url: string): BangumiUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userRegex)?.[1]

  if (!username) {
    return { kind: 'home' }
  }

  return { kind: 'user', username }
}

export const bangumiHandler: PlatformHandler = {
  match: (url) => {
    return parseBangumiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBangumiUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'user') {
      const base = `${origin}/feed/user/${encodePathSegment(parsed.username)}`

      return [
        { uri: `${base}/interests`, hint: composeHint('bangumi:collections') },
        { uri: `${base}/timeline`, hint: composeHint('bangumi:timeline') },
      ]
    }

    return [{ uri: `${origin}/feed/blog/all`, hint: composeHint('bangumi:blog') }]
  },
}
