import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers site.

export type EstrankyUrl = { kind: 'site' }

const domains = ['estranky.cz', 'estranky.sk']

const excludedSubdomains = ['katalog', 'napoveda', 'nova-napoveda', 'www']

export const parseEstrankyUrl = (url: string): EstrankyUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (!subdomain || isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  return { kind: 'site' }
}

export const estrankyHandler: PlatformHandler = {
  match: (url) => {
    return parseEstrankyUrl(url) !== undefined
  },

  // A site serves the article feeds, the Web Slice feeds or both, by its template, and answers
  // 404 on a set it lacks. Its `photos.xml` and `comments.xml` links serve the posts feed.
  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/rss/articles/data.xml`, hint: composeHint('estranky:posts') },
      { uri: `${origin}/rss/photos/data.xml`, hint: composeHint('estranky:photos') },
      { uri: `${origin}/rss/comments/data.xml`, hint: composeHint('estranky:comments') },
      {
        uri: `${origin}/rss/slices/l/homepage/data.xml`,
        hint: composeHint('estranky:homepage-slice'),
      },
      {
        uri: `${origin}/rss/slices/l/photos/data.xml`,
        hint: composeHint('estranky:photos-slice'),
      },
    ]
  },
}
