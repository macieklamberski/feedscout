import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

const categoryPattern = /^\/category\/([^/]+)/
const tagPattern = /^\/tag\/([^/]+)/
const authorPattern = /^\/author\/([^/]+)/

export const wordpressHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'wordpress.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /category/{slug}/
    const categoryMatch = pathname.match(categoryPattern)

    if (categoryMatch?.[1]) {
      uris.push({
        uri: [
          `${origin}/category/${categoryMatch[1]}/feed/`,
          `${origin}/category/${categoryMatch[1]}/?feed=rss`,
        ],
        hint: composeHint('wordpress:category'),
      })
    }

    // Tag page: /tag/{slug}/
    const tagMatch = pathname.match(tagPattern)

    if (tagMatch?.[1]) {
      uris.push({
        uri: [`${origin}/tag/${tagMatch[1]}/feed/`, `${origin}/tag/${tagMatch[1]}/?feed=rss`],
        hint: composeHint('wordpress:tag'),
      })
    }

    // Author page: /author/{username}/
    const authorMatch = pathname.match(authorPattern)

    if (authorMatch?.[1]) {
      uris.push({
        uri: [
          `${origin}/author/${authorMatch[1]}/feed/`,
          `${origin}/author/${authorMatch[1]}/?feed=rss`,
        ],
        hint: composeHint('wordpress:author'),
      })
    }

    // Always include main blog feeds.
    uris.push({
      uri: [`${origin}/feed/`, `${origin}/?feed=rss`],
      hint: composeHint('wordpress:posts-rss2'),
    })
    uris.push({
      uri: [`${origin}/feed/rss2/`, `${origin}/?feed=rss2`],
      hint: composeHint('wordpress:posts-rss2-alt'),
    })
    uris.push({
      uri: [`${origin}/feed/rdf/`, `${origin}/?feed=rdf`],
      hint: composeHint('wordpress:posts-rdf'),
    })
    uris.push({
      uri: [`${origin}/feed/atom/`, `${origin}/?feed=atom`],
      hint: composeHint('wordpress:posts-atom'),
    })
    uris.push({
      uri: [`${origin}/comments/feed/`, `${origin}/?feed=comments-rss2`],
      hint: composeHint('wordpress:comments'),
    })
    uris.push({
      uri: [`${origin}/comments/feed/rss2/`, `${origin}/?feed=comments-rss2`],
      hint: composeHint('wordpress:comments-rss2'),
    })
    uris.push({
      uri: [`${origin}/comments/feed/rdf/`, `${origin}/?feed=comments-rdf`],
      hint: composeHint('wordpress:comments-rdf'),
    })
    uris.push({
      uri: [`${origin}/comments/feed/atom/`, `${origin}/?feed=comments-atom`],
      hint: composeHint('wordpress:comments-atom'),
    })

    return uris
  },
}
