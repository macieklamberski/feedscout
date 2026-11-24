import { describe, expect, it } from 'bun:test'
import { isShopserveHtml, shopserveHandler } from './shopserve.js'

const shopserveHtml = '<a href="/hpgen/HPB/categories/15070.html">'

describe('isShopserveHtml', () => {
  it('should return true for a link to a generated page', () => {
    expect(isShopserveHtml(shopserveHtml)).toBe(true)
  })

  it('should return true for a theme image', () => {
    const value = '<img src="/hpgen/HPB/theme/img/rss.gif" alt="RSS">'

    expect(isShopserveHtml(value)).toBe(true)
  })

  it('should return false for a generated page on another host', () => {
    const value = '<a href="https://example.com/hpgen/HPB/entries/147.html">'

    expect(isShopserveHtml(value)).toBe(false)
  })

  it('should return false for a link to a product page', () => {
    expect(isShopserveHtml('<a href="/SHOP/rating_list.html">')).toBe(false)
  })
})

describe('shopserveHandler', () => {
  describe('match', () => {
    it('should match a shop page', () => {
      expect(shopserveHandler.match('https://example.com/SHOP/12.html', shopserveHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(shopserveHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the news feed', () => {
      const value = 'https://example.com/hpgen/HPB/entries/52.html'
      const expected = [
        {
          uri: 'https://example.com/hpgen/HPB/rss.xml',
          hint: { key: 'shopserve:news', label: 'News' },
        },
      ]

      expect(shopserveHandler.resolve(value)).toEqual(expected)
    })
  })
})
