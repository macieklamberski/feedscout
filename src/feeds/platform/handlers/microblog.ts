import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.
//
// Some Micro.blog users configure custom domains; HTML autodiscovery on those blogs
// may point to off-platform URLs (e.g. manton.micro.blog → www.manton.org/feed.xml).
// The handler always returns the {slug}.micro.blog/* form (the platform itself may
// still 302-redirect to the user's custom domain).

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
