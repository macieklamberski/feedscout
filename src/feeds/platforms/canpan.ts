import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type CanpanUrl = { kind: 'blog'; blog: string }

const hosts = ['blog.canpan.info']

export const parseCanpanUrl = (url: string): CanpanUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [blog] = getPathSegments(url)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const canpanHandler: PlatformHandler = {
  match: (url) => {
    return parseCanpanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanpanUrl(url)

    if (!parsed) {
      return []
    }

    const { blog } = parsed

    return [
      {
        uri: `https://blog.canpan.info/${blog}/index2_0.xml`,
        hint: composeHint('canpan:posts', 'rss'),
      },
      {
        uri: `https://blog.canpan.info/${blog}/index1_0.rdf`,
        hint: composeHint('canpan:posts', 'rdf'),
      },
    ]
  },
}
