import { describe, expect, it } from 'bun:test'
import { isShopifyHeaders, shopifyHandler } from './shopify.js'

const shopifyHeaders = new Headers({ 'powered-by': 'Shopify' })

describe('isShopifyHeaders', () => {
  it('should return true for the powered-by header', () => {
    expect(isShopifyHeaders(shopifyHeaders)).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isShopifyHeaders(new Headers())).toBe(false)
    expect(isShopifyHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

describe('shopifyHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(shopifyHandler.match('https://example.com/blogs/news', '', shopifyHeaders)).toBe(true)
    })

    it('should match a blog post page', () => {
      const value = 'https://example.com/blogs/news/a-post'

      expect(shopifyHandler.match(value, '', shopifyHeaders)).toBe(true)
    })

    it('should not match the store root', () => {
      expect(shopifyHandler.match('https://example.com/', '', shopifyHeaders)).toBe(false)
    })

    it('should not match a product page', () => {
      const value = 'https://example.com/products/shoes'

      expect(shopifyHandler.match(value, '', shopifyHeaders)).toBe(false)
    })

    it('should not match without the header', () => {
      expect(shopifyHandler.match('https://example.com/blogs/news')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(shopifyHandler.match('not-a-url', '', shopifyHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog feed', () => {
      const value = 'https://example.com/blogs/news'
      const expected = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should use the blog handle from a post page', () => {
      const value = 'https://example.com/blogs/journal/a-post'
      const expected = [
        {
          uri: 'https://example.com/blogs/journal.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the store root', () => {
      expect(shopifyHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(shopifyHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
