import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

const categoryRegex = /^\/category\/([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/
const authorRegex = /^\/author\/([^/]+)/
const yearRegex = /^\/(\d{4})\/?$/
const yearMonthRegex = /^\/(\d{4})\/(\d{2})\/?$/

export const wordpressHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'wordpress.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /category/{slug}/
    const categoryMatch = pathname.match(categoryRegex)

    if (categoryMatch?.[1]) {
      uris.push({
        uri: [
          `${origin}/category/${categoryMatch[1]}/feed/`,
          `${origin}/category/${categoryMatch[1]}/?feed=rss`,
        ],
        hint: composeHint('wordpress:category-rss'),
      })
      uris.push({
        uri: [
          `${origin}/category/${categoryMatch[1]}/feed/atom/`,
          `${origin}/category/${categoryMatch[1]}/?feed=atom`,
        ],
        hint: composeHint('wordpress:category-atom'),
      })
      uris.push({
        uri: [
          `${origin}/category/${categoryMatch[1]}/feed/rdf/`,
          `${origin}/category/${categoryMatch[1]}/?feed=rdf`,
        ],
        hint: composeHint('wordpress:category-rdf'),
      })
    }

    // Tag page: /tag/{slug}/
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      uris.push({
        uri: [`${origin}/tag/${tagMatch[1]}/feed/`, `${origin}/tag/${tagMatch[1]}/?feed=rss`],
        hint: composeHint('wordpress:tag-rss'),
      })
      uris.push({
        uri: [`${origin}/tag/${tagMatch[1]}/feed/atom/`, `${origin}/tag/${tagMatch[1]}/?feed=atom`],
        hint: composeHint('wordpress:tag-atom'),
      })
      uris.push({
        uri: [`${origin}/tag/${tagMatch[1]}/feed/rdf/`, `${origin}/tag/${tagMatch[1]}/?feed=rdf`],
        hint: composeHint('wordpress:tag-rdf'),
      })
    }

    // Author page: /author/{username}/
    const authorMatch = pathname.match(authorRegex)

    if (authorMatch?.[1]) {
      uris.push({
        uri: [
          `${origin}/author/${authorMatch[1]}/feed/`,
          `${origin}/author/${authorMatch[1]}/?feed=rss`,
        ],
        hint: composeHint('wordpress:author-rss'),
      })
      uris.push({
        uri: [
          `${origin}/author/${authorMatch[1]}/feed/atom/`,
          `${origin}/author/${authorMatch[1]}/?feed=atom`,
        ],
        hint: composeHint('wordpress:author-atom'),
      })
      uris.push({
        uri: [
          `${origin}/author/${authorMatch[1]}/feed/rdf/`,
          `${origin}/author/${authorMatch[1]}/?feed=rdf`,
        ],
        hint: composeHint('wordpress:author-rdf'),
      })
    }

    // Month archive page: /{year}/{month}/
    const yearMonthMatch = pathname.match(yearMonthRegex)

    if (yearMonthMatch?.[1] && yearMonthMatch?.[2]) {
      uris.push({
        uri: `${origin}/${yearMonthMatch[1]}/${yearMonthMatch[2]}/feed/`,
        hint: composeHint('wordpress:date-archive-rss'),
      })
      uris.push({
        uri: `${origin}/${yearMonthMatch[1]}/${yearMonthMatch[2]}/feed/atom/`,
        hint: composeHint('wordpress:date-archive-atom'),
      })
      uris.push({
        uri: `${origin}/${yearMonthMatch[1]}/${yearMonthMatch[2]}/feed/rdf/`,
        hint: composeHint('wordpress:date-archive-rdf'),
      })
    }

    // Year archive page: /{year}/
    const yearMatch = pathname.match(yearRegex)

    if (yearMatch?.[1]) {
      uris.push({
        uri: `${origin}/${yearMatch[1]}/feed/`,
        hint: composeHint('wordpress:date-archive-rss'),
      })
      uris.push({
        uri: `${origin}/${yearMatch[1]}/feed/atom/`,
        hint: composeHint('wordpress:date-archive-atom'),
      })
      uris.push({
        uri: `${origin}/${yearMatch[1]}/feed/rdf/`,
        hint: composeHint('wordpress:date-archive-rdf'),
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
