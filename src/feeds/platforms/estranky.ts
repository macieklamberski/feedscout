import { getSubdomain, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers customDomainSite, site, skSite.

export type EstrankyUrl = { kind: 'site' }

export type EstrankyPage = { origin: string; sliceOrigin: string }

const domains = ['estranky.cz', 'estranky.sk']

const estrankyAssetRegex = /^(?:https?:)?\/\/s3[a-z]\.(?:estranky\.(?:cz|sk)|eoldal\.hu)\//i

const assetTags = ['link', 'script']

// A site keeps the scheme it picked. A site in another language serves its feeds under the language
// segment too, as `/rss/en/slices/l/homepage/data.xml`. A section feed and the Web Slices of one
// article, section or photo folder carry its id, which no page URL names, so they are only claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'estranky:posts', template: '{scheme}://{host}/rss/articles/data.xml' },
    { key: 'estranky:posts', template: '{scheme}://{host}/rss/{language}/articles/data.xml' },
    { key: 'estranky:photos', template: '{scheme}://{host}/rss/photos/data.xml' },
    { key: 'estranky:photos', template: '{scheme}://{host}/rss/{language}/photos/data.xml' },
    { key: 'estranky:comments', template: '{scheme}://{host}/rss/comments/data.xml' },
    { key: 'estranky:comments', template: '{scheme}://{host}/rss/{language}/comments/data.xml' },
    {
      key: 'estranky:homepage-slice',
      template: '{scheme}://{host}/rss/slices/l/homepage/data.xml',
    },
    {
      key: 'estranky:homepage-slice',
      template: '{scheme}://{host}/rss/{language}/slices/l/homepage/data.xml',
    },
    { key: 'estranky:photos-slice', template: '{scheme}://{host}/rss/slices/l/photos/data.xml' },
    {
      key: 'estranky:photos-slice',
      template: '{scheme}://{host}/rss/{language}/slices/l/photos/data.xml',
    },
    { key: 'estranky:section', template: '{scheme}://{host}/rss/section/{section}/data.xml' },
    {
      key: 'estranky:section',
      template: '{scheme}://{host}/rss/{language}/section/{section}/data.xml',
    },
    {
      key: 'estranky:article-slice',
      template: '{scheme}://{host}/rss/slices/a/{article}/data.xml',
    },
    {
      key: 'estranky:article-slice',
      template: '{scheme}://{host}/rss/{language}/slices/a/{article}/data.xml',
    },
    {
      key: 'estranky:section-slice',
      template: '{scheme}://{host}/rss/slices/s/{section}/data.xml',
    },
    {
      key: 'estranky:section-slice',
      template: '{scheme}://{host}/rss/{language}/slices/s/{section}/data.xml',
    },
    {
      key: 'estranky:photo-folder-slice',
      template: '{scheme}://{host}/rss/slices/d/{folder}/data.xml',
    },
    {
      key: 'estranky:photo-folder-slice',
      template: '{scheme}://{host}/rss/{language}/slices/d/{folder}/data.xml',
    },
  ],
  { domains, isWwwTenantPrefix: true },
)

// Every template loads its stylesheet and `ui.js` from the asset hosts, on a custom domain too.
export const isEstrankyHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    const source = element.attribs.href ?? element.attribs.src ?? ''

    return assetTags.includes(element.name) && estrankyAssetRegex.test(source)
  })

  return asset !== undefined
}

// The apex and www run Estranky itself. Every other host is one site.
export const parseEstrankyUrl = (url: string): EstrankyUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || isHostOf(parsedUrl, domains)) {
    return
  }

  if (isAnyOf(getSubdomain(parsedUrl, domains), 'www')) {
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
    const siteFeeds = feeds.forUrl(origin)
    const sliceFeeds = feeds.forUrl(sliceOrigin)

    if (!siteFeeds || !sliceFeeds) {
      return []
    }

    return [
      siteFeeds.getFeedEntry('estranky:posts'),
      siteFeeds.getFeedEntry('estranky:photos'),
      siteFeeds.getFeedEntry('estranky:comments'),
      sliceFeeds.getFeedEntry('estranky:homepage-slice'),
      sliceFeeds.getFeedEntry('estranky:photos-slice'),
    ]
  },

  // A custom domain is known only by its markers, so its feeds are built but not claimed.
  getFeedHint: feeds.getFeedHint,
}
