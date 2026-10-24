import { encodePathSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (html), partly covers user.

export type BangumiUrl = { kind: 'user'; username: string } | { kind: 'home' }

// chii.in serves the same site, but answers a plain fetch of its feeds with a Cloudflare challenge,
// so its pages get the bgm.tv feeds.
const challengedHosts = ['chii.in']
const hosts = ['bgm.tv', 'bangumi.tv', ...challengedHosts]

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

    const parsedUrl = new URL(url)
    const origin = isHostOf(parsedUrl, challengedHosts) ? 'https://bgm.tv' : parsedUrl.origin

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
