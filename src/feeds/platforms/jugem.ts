import { getSubdomain } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['jugem.jp']

export const jugemHandler: PlatformHandler = {
  match: (url) => {
    const blog = getSubdomain(url, domains)

    if (!blog || blog.includes('.')) {
      return false
    }

    // Only {blog}.jugem.jp names a blog, www.jugem.jp is the portal.
    return blog !== 'www'
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/?mode=rss`, hint: composeHint('jugem:posts', 'rdf') },
      { uri: `${origin}/?mode=atom`, hint: composeHint('jugem:posts', 'atom') },
    ]
  },
}
