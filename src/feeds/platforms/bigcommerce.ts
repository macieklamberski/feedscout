import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers category, home, search.

const searchPathRegex = /^\/search\.php$/i
const categoryFeedRegex = /\/rss\.php\?(?:[^#]*&)?categoryid=(\d+)/i

export type BigcommercePage =
  | { kind: 'category'; categoryId: string }
  | { kind: 'search'; query: string }
  | { kind: 'home' }

export const isBigcommerceHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('SHOP_SESSION_TOKEN')
}

// A category url carries only its slug, and rss.php answers a made-up category id with an
// empty feed, so the id comes from the feed link the category page prints.
const getCategoryId = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && categoryFeedRegex.test(element.attribs.href ?? '')
  })

  return link?.attribs.href?.match(categoryFeedRegex)?.[1]
}

const getBigcommercePage = (url: string, content: string | undefined): BigcommercePage => {
  const { pathname, searchParams } = new URL(url)
  const query = searchParams.get('search_query')

  if (searchPathRegex.test(pathname) && query) {
    return { kind: 'search', query }
  }

  const categoryId = getCategoryId(content)

  if (categoryId) {
    return { kind: 'category', categoryId }
  }

  return { kind: 'home' }
}

export const bigcommerceHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isBigcommerceHeaders })
  },

  resolve: (url, content) => {
    const page = getBigcommercePage(url, content)
    const feedUrl = `${new URL(url).origin}/rss.php`
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'category') {
      const { categoryId } = page

      uris.push(
        {
          uri: `${feedUrl}?categoryid=${categoryId}&type=rss`,
          hint: composeHint('bigcommerce:category-new-products', 'rss'),
        },
        {
          uri: `${feedUrl}?categoryid=${categoryId}&type=atom`,
          hint: composeHint('bigcommerce:category-new-products', 'atom'),
        },
        {
          uri: `${feedUrl}?action=popularproducts&categoryid=${categoryId}&type=rss`,
          hint: composeHint('bigcommerce:category-popular-products', 'rss'),
        },
        {
          uri: `${feedUrl}?action=popularproducts&categoryid=${categoryId}&type=atom`,
          hint: composeHint('bigcommerce:category-popular-products', 'atom'),
        },
      )
    }

    if (page.kind === 'search') {
      const params = { action: 'searchproducts', search_query: page.query }

      uris.push(
        {
          uri: `${feedUrl}?${new URLSearchParams({ ...params, type: 'rss' })}`,
          hint: composeHint('bigcommerce:search', 'rss'),
        },
        {
          uri: `${feedUrl}?${new URLSearchParams({ ...params, type: 'atom' })}`,
          hint: composeHint('bigcommerce:search', 'atom'),
        },
      )
    }

    uris.push(
      { uri: `${feedUrl}?type=rss`, hint: composeHint('bigcommerce:new-products', 'rss') },
      { uri: `${feedUrl}?type=atom`, hint: composeHint('bigcommerce:new-products', 'atom') },
      {
        uri: `${feedUrl}?action=popularproducts&type=rss`,
        hint: composeHint('bigcommerce:popular-products', 'rss'),
      },
      {
        uri: `${feedUrl}?action=popularproducts&type=atom`,
        hint: composeHint('bigcommerce:popular-products', 'atom'),
      },
      {
        uri: `${feedUrl}?action=featuredproducts&type=rss`,
        hint: composeHint('bigcommerce:featured-products', 'rss'),
      },
      {
        uri: `${feedUrl}?action=featuredproducts&type=atom`,
        hint: composeHint('bigcommerce:featured-products', 'atom'),
      },
      {
        uri: `${feedUrl}?action=newblogs&type=rss`,
        hint: composeHint('bigcommerce:blog', 'rss'),
      },
      {
        uri: `${feedUrl}?action=newblogs&type=atom`,
        hint: composeHint('bigcommerce:blog', 'atom'),
      },
    )

    return uris
  },
}
