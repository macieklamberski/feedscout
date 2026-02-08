import type { UriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

const categoryPathRegex = /^\/category\/([^/]+)/
const tagPathRegex = /^\/tag\/([^/]+)/
const authorPathRegex = /^\/author\/([^/]+)/

export const wordpressHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'wordpress.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<UriEntry> = []

    // Category page: /category/{slug}/
    const categoryMatch = pathname.match(categoryPathRegex)

    if (categoryMatch?.[1]) {
      uris.push(`${origin}/category/${categoryMatch[1]}/feed/`)
    }

    // Tag page: /tag/{slug}/
    const tagMatch = pathname.match(tagPathRegex)

    if (tagMatch?.[1]) {
      uris.push(`${origin}/tag/${tagMatch[1]}/feed/`)
    }

    // Author page: /author/{username}/
    const authorMatch = pathname.match(authorPathRegex)

    if (authorMatch?.[1]) {
      uris.push(`${origin}/author/${authorMatch[1]}/feed/`)
    }

    // Always include main blog feeds.
    uris.push([`${origin}/feed/`, `${origin}/?feed=rss`])
    uris.push([`${origin}/feed/rss2/`, `${origin}/?feed=rss2`])
    uris.push([`${origin}/feed/rdf/`, `${origin}/?feed=rdf`])
    uris.push([`${origin}/feed/atom/`, `${origin}/?feed=atom`])
    uris.push([`${origin}/comments/feed/`, `${origin}/?feed=comments-rss2`])
    uris.push([`${origin}/comments/feed/rss2/`, `${origin}/?feed=comments-rss2`])
    uris.push([`${origin}/comments/feed/rdf/`, `${origin}/?feed=comments-rdf`])
    uris.push([`${origin}/comments/feed/atom/`, `${origin}/?feed=comments-atom`])

    return uris
  },
}
