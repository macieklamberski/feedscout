import { getSubdomain, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers customDomainSite, site, skSite.

export type EstrankyUrl = { kind: 'site' }

export type EstrankyPage = { origin: string; sliceOrigin: string }

const domains = ['estranky.cz', 'estranky.sk']

const estrankyAssetRegex = /^(?:https?:)?\/\/s3[a-z]\.(?:estranky\.(?:cz|sk)|eoldal\.hu)\//

const assetTags = ['link', 'script']
const excludedSubdomains = ['katalog', 'napoveda', 'nova-napoveda', 'www']

// Every template loads its stylesheet and `ui.js` from the asset hosts, on a custom domain too.
export const isEstrankyHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    const source = element.attribs.href ?? element.attribs.src ?? ''

    return assetTags.includes(element.name) && estrankyAssetRegex.test(source)
  })

  return asset !== undefined
}

// The apex and the service subdomains run Estranky itself. Every other host is one site.
export const parseEstrankyUrl = (url: string): EstrankyUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || isHostOf(parsedUrl, domains)) {
    return
  }

  if (isAnyOf(getSubdomain(parsedUrl, domains), excludedSubdomains)) {
    return
  }

  return { kind: 'site' }
}

// A slice template on a custom domain links the home page slice on the Estranky subdomain.
// An eOldal slice template links its `eoldal.hu` subdomain, which no longer resolves, so its
// slices stay on the page's origin.
const getEstrankyPage = (url: string, content: string | undefined): EstrankyPage => {
  const { origin } = new URL(url)
  const anchor = findElement(content, (element) => {
    const href = element.attribs.href ?? ''

    return element.name === 'a' && element.attribs.rel === 'feedurl' && isSubdomainOf(href, domains)
  })

  if (!anchor?.attribs.href) {
    return { origin, sliceOrigin: origin }
  }

  return { origin, sliceOrigin: new URL(anchor.attribs.href).origin }
}

export const estrankyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isSubdomainOf(url, domains) && !hasMarker(content, headers, { html: isEstrankyHtml })) {
      return false
    }

    return parseEstrankyUrl(url) !== undefined
  },

  // A site serves the article feeds, the Web Slice feeds or both, by its template, and answers
  // 404 on a set it lacks. Its `photos.xml` and `comments.xml` links serve the posts feed.
  resolve: (url, content) => {
    const { origin, sliceOrigin } = getEstrankyPage(url, content)

    return [
      { uri: `${origin}/rss/articles/data.xml`, hint: composeHint('estranky:posts') },
      { uri: `${origin}/rss/photos/data.xml`, hint: composeHint('estranky:photos') },
      { uri: `${origin}/rss/comments/data.xml`, hint: composeHint('estranky:comments') },
      {
        uri: `${sliceOrigin}/rss/slices/l/homepage/data.xml`,
        hint: composeHint('estranky:homepage-slice'),
      },
      {
        uri: `${sliceOrigin}/rss/slices/l/photos/data.xml`,
        hint: composeHint('estranky:photos-slice'),
      },
    ]
  },
}
