import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type AlloforumUrl =
  | { kind: 'forum' }
  | { kind: 'category'; slug: string; categoryId: string }
  | {
      kind: 'subcategory'
      slug: string
      categoryId: string
      subcategorySlug: string
      subcategoryId: string
    }

const domains = ['alloforum.com']

// The route letters are read in any case and the feed url is minted with them lowercase, because
// the site answers 404 to an uppercase `C` or `S`.
const categoryRegex = /^\/([^/]+)-c(\d+)-\d+\.html$/i
const subcategoryRegex = /^\/([^/]+)-c(\d+)-([^/]+)-s(\d+)-\d+\.html$/i

// The subcategory row comes first, since a subcategory feed also fits the category template.
const feeds = definePlatformFeeds(
  [
    {
      key: 'alloforum:subcategory',
      template:
        '{scheme}://{host}/derniers-sujets-{slug}-c{categoryId}-{subcategorySlug}-s{subcategoryId}.xml',
    },
    {
      key: 'alloforum:category',
      template: '{scheme}://{host}/derniers-sujets-{slug}-c{categoryId}.xml',
    },
    { key: 'alloforum:latest-topics', template: '{scheme}://{host}/derniers-sujets.xml' },
  ],
  { domains },
)

export const parseAlloforumUrl = (url: string): AlloforumUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  // The certificate covers one label, so a dotted subdomain such as www.{forum} names no forum.
  const forum = getTenantSubdomain(url, domains)

  if (!pathname || !forum) {
    return
  }

  const subcategoryMatch = pathname.match(subcategoryRegex)

  if (subcategoryMatch?.[1] && subcategoryMatch[2] && subcategoryMatch[3] && subcategoryMatch[4]) {
    return {
      kind: 'subcategory',
      slug: subcategoryMatch[1],
      categoryId: subcategoryMatch[2],
      subcategorySlug: subcategoryMatch[3],
      subcategoryId: subcategoryMatch[4],
    }
  }

  const categoryMatch = pathname.match(categoryRegex)

  if (categoryMatch?.[1] && categoryMatch[2]) {
    return { kind: 'category', slug: categoryMatch[1], categoryId: categoryMatch[2] }
  }

  return { kind: 'forum' }
}

export const alloforumHandler: PlatformHandler = {
  match: (url) => {
    return parseAlloforumUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAlloforumUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'subcategory') {
      return [
        page.getFeedEntry('alloforum:subcategory', parsed),
        page.getFeedEntry('alloforum:latest-topics'),
      ]
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('alloforum:category', parsed),
        page.getFeedEntry('alloforum:latest-topics'),
      ]
    }

    return [page.getFeedEntry('alloforum:latest-topics')]
  },

  getFeedHint: feeds.getFeedHint,
}
