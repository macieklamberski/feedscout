import type { DiscoverUriEntry } from '../../../common/types.js'
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
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /category/{slug}/
    const categoryMatch = pathname.match(categoryPathRegex)

    if (categoryMatch?.[1]) {
      uris.push({
        uri: `${origin}/category/${categoryMatch[1]}/feed/`,
        hint: { key: 'wordpress:category', label: 'Category' },
      })
    }

    // Tag page: /tag/{slug}/
    const tagMatch = pathname.match(tagPathRegex)

    if (tagMatch?.[1]) {
      uris.push({
        uri: `${origin}/tag/${tagMatch[1]}/feed/`,
        hint: { key: 'wordpress:tag', label: 'Tag' },
      })
    }

    // Author page: /author/{username}/
    const authorMatch = pathname.match(authorPathRegex)

    if (authorMatch?.[1]) {
      uris.push({
        uri: `${origin}/author/${authorMatch[1]}/feed/`,
        hint: { key: 'wordpress:author', label: 'Author' },
      })
    }

    // Always include main blog feeds.
    uris.push({
      uri: [`${origin}/feed/`, `${origin}/?feed=rss`],
      hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
    })
    uris.push({
      uri: [`${origin}/feed/rss2/`, `${origin}/?feed=rss2`],
      hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
    })
    uris.push({
      uri: [`${origin}/feed/rdf/`, `${origin}/?feed=rdf`],
      hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
    })
    uris.push({
      uri: [`${origin}/feed/atom/`, `${origin}/?feed=atom`],
      hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
    })
    uris.push({
      uri: [`${origin}/comments/feed/`, `${origin}/?feed=comments-rss2`],
      hint: { key: 'wordpress:comments', label: 'Comments' },
    })
    uris.push({
      uri: [`${origin}/comments/feed/rss2/`, `${origin}/?feed=comments-rss2`],
      hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
    })
    uris.push({
      uri: [`${origin}/comments/feed/rdf/`, `${origin}/?feed=comments-rdf`],
      hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
    })
    uris.push({
      uri: [`${origin}/comments/feed/atom/`, `${origin}/?feed=comments-atom`],
      hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
    })

    return uris
  },
}
