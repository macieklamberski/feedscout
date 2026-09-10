import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Micro.blog serves per-user feeds under predictable Hugo-style paths on each
// `{slug}.micro.blog` subdomain: `/feed.xml`, `/feed.json`, `/podcast.xml`,
// `/podcast.json`, plus `/categories/{slug}/feed.{xml,json}`, `/archive/index.json`,
// `/photos/index.json`, and `/replies.xml` when enabled. HTML autodiscovery is
// present but may point off-platform when users configure custom domains
// (e.g. `manton.micro.blog` advertises `www.manton.org/feed.xml`); the handler
// guarantees the `{slug}.micro.blog/*` form regardless of redirect target.

const categoryRegex = /^\/categories\/([^/]+)/

export const microblogHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'micro.blog')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /categories/{slug}
    const categoryMatch = pathname.match(categoryRegex)

    if (categoryMatch?.[1]) {
      const category = categoryMatch[1]

      uris.push({
        uri: `${origin}/categories/${category}/feed.xml`,
        hint: composeHint('microblog:category-rss'),
      })
      uris.push({
        uri: `${origin}/categories/${category}/feed.json`,
        hint: composeHint('microblog:category-json'),
      })
    }

    // Archive page: /archive
    if (pathname.startsWith('/archive')) {
      uris.push({
        uri: `${origin}/archive/index.json`,
        hint: composeHint('microblog:archive'),
      })
    }

    // Photos page: /photos
    if (pathname.startsWith('/photos')) {
      uris.push({
        uri: `${origin}/photos/index.json`,
        hint: composeHint('microblog:photos'),
      })
    }

    // Replies page: /replies
    if (pathname.startsWith('/replies')) {
      uris.push({
        uri: `${origin}/replies.xml`,
        hint: composeHint('microblog:replies'),
      })
    }

    // Always include main feeds.
    uris.push({ uri: `${origin}/feed.xml`, hint: composeHint('microblog:posts-rss') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('microblog:posts-json') })
    uris.push({ uri: `${origin}/podcast.xml`, hint: composeHint('microblog:podcast') })
    uris.push({ uri: `${origin}/podcast.json`, hint: composeHint('microblog:podcast-json') })

    return uris
  },
}
