import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

const tagRegex = /^\/tag\/([^/]+)/

export const pikaHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'pika.page')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Tag page: /tag/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      uris.push({
        uri: `${origin}/tag/${tag}/feed`,
        hint: composeHint('pika:tag-atom'),
      })
      uris.push({
        uri: `${origin}/tag/${tag}/feed.rss`,
        hint: composeHint('pika:tag-rss'),
      })
    }

    uris.push({ uri: `${origin}/posts_feed`, hint: composeHint('pika:posts-atom') })
    uris.push({ uri: `${origin}/posts_feed.rss`, hint: composeHint('pika:posts-rss') })

    return uris
  },
}
