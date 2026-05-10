import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

// Partially discoverable without handler.

const apexHosts = ['prose.sh', 'www.prose.sh']

export const proseHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'prose.sh') || isHostOf(url, apexHosts)
  },

  resolve: (url) => {
    const { origin, searchParams } = new URL(url)

    // Apex prose.sh is the platform-wide discovery firehose, not a per-blog feed.
    if (isHostOf(url, apexHosts)) {
      return [
        {
          uri: 'https://prose.sh/rss',
          hint: composeHint('prose:discovery'),
        },
      ]
    }

    const tag = searchParams.get('tag')

    if (tag) {
      return [
        {
          uri: `${origin}/rss?tag=${encodeURIComponent(tag)}`,
          hint: composeHint('prose:tag'),
        },
      ]
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('prose:blog') }]
  },
}
