import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Pika exposes Atom (`/posts_feed`) and RSS (`/posts_feed.rss`) per blog on every
// `*.pika.page` subdomain, plus matching `/tag/{tag}/feed` and `/tag/{tag}/feed.rss`
// pairs. The blog and tag pages each advertise the Atom variant via HTML
// `<link rel="alternate">`, and Pika also accepts legacy redirect aliases
// (`/feed`, `/feed.xml`, `/rss`, etc.) that all 30x to `/posts_feed`. The handler
// emits both Atom and RSS for the blog and any tag page so consumers can pick
// either format without needing the alias chain.

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
