import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { bigcommerceHandler, isBigcommerceHeaders } from './bigcommerce.js'

const bigcommerceHeaders = new Headers([
  ['set-cookie', 'SF-CSRF-TOKEN=55365132-05b9-471f-97b8-8931251be1c3; Path=/; Secure'],
  ['set-cookie', 'SHOP_SESSION_TOKEN=0031aa16-9845-4060-97e1-55879ec7ea6a; Path=/; Secure'],
])
const categoryHtml = `
  <link
    rel="alternate"
    type="application/rss+xml"
    title="New Products in NCAA Shop (RSS 2.0)"
    href="https://www.example.com/rss.php?categoryid=153033&amp;type=rss"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="New Products (RSS 2.0)"
    href="https://www.example.com/rss.php?type=rss"
  />
`
const storeFeeds: Array<DiscoverUriEntry> = [
  {
    uri: 'https://www.example.com/rss.php?type=rss',
    hint: { key: 'bigcommerce:new-products', label: 'New products', format: 'rss' },
  },
  {
    uri: 'https://www.example.com/rss.php?type=atom',
    hint: { key: 'bigcommerce:new-products', label: 'New products', format: 'atom' },
  },
  {
    uri: 'https://www.example.com/rss.php?action=popularproducts&type=rss',
    hint: { key: 'bigcommerce:popular-products', label: 'Popular products', format: 'rss' },
  },
  {
    uri: 'https://www.example.com/rss.php?action=popularproducts&type=atom',
    hint: { key: 'bigcommerce:popular-products', label: 'Popular products', format: 'atom' },
  },
  {
    uri: 'https://www.example.com/rss.php?action=featuredproducts&type=rss',
    hint: { key: 'bigcommerce:featured-products', label: 'Featured products', format: 'rss' },
  },
  {
    uri: 'https://www.example.com/rss.php?action=featuredproducts&type=atom',
    hint: { key: 'bigcommerce:featured-products', label: 'Featured products', format: 'atom' },
  },
  {
    uri: 'https://www.example.com/rss.php?action=newblogs&type=rss',
    hint: { key: 'bigcommerce:blog', label: 'Blog', format: 'rss' },
  },
  {
    uri: 'https://www.example.com/rss.php?action=newblogs&type=atom',
    hint: { key: 'bigcommerce:blog', label: 'Blog', format: 'atom' },
  },
]

describe('isBigcommerceHeaders', () => {
  it('should return true for the shop session cookie', () => {
    expect(isBigcommerceHeaders(bigcommerceHeaders)).toBe(true)
  })

  it('should return false for the cookies of another store platform', () => {
    const headers = new Headers({ 'set-cookie': '_shopify_y=d2a8c3f1; Path=/; Secure' })

    expect(isBigcommerceHeaders(headers)).toBe(false)
  })
})

describe('bigcommerceHandler', () => {
  describe('match', () => {
    it('should match a BigCommerce store by its session cookie', () => {
      const value = 'https://www.example.com/'

      expect(bigcommerceHandler.match(value, '<html></html>', bigcommerceHeaders)).toBe(true)
    })

    it('should not match another page', () => {
      const value = 'https://www.example.com/'

      expect(bigcommerceHandler.match(value, '<html></html>', new Headers())).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the store feeds when the category feed link names category 0', () => {
      const value = 'https://www.example.com/categories/'
      const content =
        '<link rel="alternate" href="https://www.example.com/rss.php?categoryid=0&amp;type=rss" />'

      expect(bigcommerceHandler.resolve(value, content)).toEqual(storeFeeds)
    })

    it('should return the store feeds for a search query outside the search page', () => {
      const value = 'https://www.example.com/hats/?search_query=hat'

      expect(bigcommerceHandler.resolve(value, '<html></html>')).toEqual(storeFeeds)
    })

    it('should ignore a category feed anchor', () => {
      const value = 'https://www.example.com/'
      const content =
        '<a href="https://www.example.com/rss.php?categoryid=153033&amp;type=rss">RSS</a>'

      expect(bigcommerceHandler.resolve(value, content)).toEqual(storeFeeds)
    })

    it('should return the store feeds on the home page', () => {
      const value = 'https://www.example.com/'

      expect(bigcommerceHandler.resolve(value, '<html></html>')).toEqual(storeFeeds)
    })

    it('should add the category feeds from the category feed link', () => {
      const value = 'https://www.example.com/ncaa-shop/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/rss.php?categoryid=153033&type=rss',
          hint: {
            key: 'bigcommerce:category-new-products',
            label: 'New products in category',
            format: 'rss',
          },
        },
        {
          uri: 'https://www.example.com/rss.php?categoryid=153033&type=atom',
          hint: {
            key: 'bigcommerce:category-new-products',
            label: 'New products in category',
            format: 'atom',
          },
        },
        {
          uri: 'https://www.example.com/rss.php?action=popularproducts&categoryid=153033&type=rss',
          hint: {
            key: 'bigcommerce:category-popular-products',
            label: 'Popular products in category',
            format: 'rss',
          },
        },
        {
          uri: 'https://www.example.com/rss.php?action=popularproducts&categoryid=153033&type=atom',
          hint: {
            key: 'bigcommerce:category-popular-products',
            label: 'Popular products in category',
            format: 'atom',
          },
        },
        ...storeFeeds,
      ]

      expect(bigcommerceHandler.resolve(value, categoryHtml)).toEqual(expected)
    })

    it('should add the search feeds on a search page', () => {
      const value = 'https://www.example.com/search.php?search_query=hat'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/rss.php?action=searchproducts&search_query=hat&type=rss',
          hint: { key: 'bigcommerce:search', label: 'Search', format: 'rss' },
        },
        {
          uri: 'https://www.example.com/rss.php?action=searchproducts&search_query=hat&type=atom',
          hint: { key: 'bigcommerce:search', label: 'Search', format: 'atom' },
        },
        ...storeFeeds,
      ]

      expect(bigcommerceHandler.resolve(value, '<html></html>')).toEqual(expected)
    })

    it('should return the store feeds on a search page without a query', () => {
      const value = 'https://www.example.com/search.php'

      expect(bigcommerceHandler.resolve(value, '<html></html>')).toEqual(storeFeeds)
    })
  })
})
