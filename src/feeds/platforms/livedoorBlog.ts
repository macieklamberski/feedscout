import { getSubdomain, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LivedoorBlogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = ['blog.jp', 'doorblog.jp', 'ldblog.jp', 'livedoor.biz']

const categoryRegex = /^\/archives\/cat_(\d+)\.html$/i

export const parseLivedoorBlogUrl = (url: string): LivedoorBlogUrl | undefined => {
  const blog = getSubdomain(url, domains)

  // A nested subdomain answers with a self-signed certificate and is no blog.
  if (!blog || blog.includes('.')) {
    return
  }

  const category = parseUrl(url)?.pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', blog, category }
  }

  return { kind: 'blog', blog }
}

export const livedoorBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseLivedoorBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLivedoorBlogUrl(url)

    if (!parsed) {
      return []
    }

    // Every blog redirects http to https, and its pages link only the https feeds.
    const origin = `https://${new URL(url).hostname}`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      uris.push({
        uri: `${origin}/archives/cat_${parsed.category}.xml`,
        hint: composeHint('livedoor-blog:category', 'rdf'),
      })
    }

    uris.push({ uri: `${origin}/index.rdf`, hint: composeHint('livedoor-blog:posts', 'rdf') })
    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('livedoor-blog:posts', 'atom') })

    return uris
  },
}
