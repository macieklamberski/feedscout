import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export type SmeBlogUrl = { kind: 'blog'; username: string } | { kind: 'home' }

const hosts = ['blog.sme.sk']

const excludedPaths = [
  'blogeri',
  'diskusie',
  'kodex-blogera',
  'najnovsie',
  'popularni',
  'premiove-blogy',
  'rebricky-clankov',
  'rss',
  't',
]

export const parseSmeBlogUrl = (url: string): SmeBlogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return { kind: 'home' }
  }

  return { kind: 'blog', username }
}

export const smeBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSmeBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSmeBlogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'blog') {
      return [{ uri: `${origin}/${parsed.username}/rss`, hint: composeHint('sme-blog:posts') }]
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('sme-blog:site') }]
  },
}
