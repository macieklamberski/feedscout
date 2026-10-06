import { getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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

// The site answers 404 to an uppercase `C` or `S`, so the route letters stay case-sensitive.
const categoryRegex = /^\/([^/]+)-c(\d+)-\d+\.html$/
const subcategoryRegex = /^\/([^/]+)-c(\d+)-([^/]+)-s(\d+)-\d+\.html$/

// The admin zone, the image host, the upload host, the www redirect to the portal and the mail
// hosts off the forum server. Every other label resolves to the forum server.
const excludedSubdomains = ['admin', 'images', 'mail', 'smtp', 'upload', 'webmail', 'www']

export const parseAlloforumUrl = (url: string): AlloforumUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const forum = getSubdomain(url, domains)

  // The certificate covers one label, so a dotted subdomain such as www.{forum} names no forum.
  if (!pathname || !forum || forum.includes('.') || isAnyOf(forum, excludedSubdomains)) {
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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'subcategory') {
      const { slug, categoryId, subcategorySlug, subcategoryId } = parsed

      uris.push({
        uri: `${origin}/derniers-sujets-${slug}-c${categoryId}-${subcategorySlug}-s${subcategoryId}.xml`,
        hint: composeHint('alloforum:subcategory'),
      })
    }

    if (parsed.kind === 'category') {
      uris.push({
        uri: `${origin}/derniers-sujets-${parsed.slug}-c${parsed.categoryId}.xml`,
        hint: composeHint('alloforum:category'),
      })
    }

    uris.push({
      uri: `${origin}/derniers-sujets.xml`,
      hint: composeHint('alloforum:latest-topics'),
    })

    return uris
  },
}
