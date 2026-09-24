import { describe, expect, it } from 'bun:test'
import { habrHandler } from './habr.js'

describe('habrHandler', () => {
  describe('match', () => {
    it('should match a Habr URL', () => {
      expect(habrHandler.match('https://habr.com/ru/articles/')).toBe(true)
      expect(habrHandler.match('https://habr.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(habrHandler.match('https://example.com/ru/articles/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(habrHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the hub and articles feeds for a hub page', () => {
      const value = 'https://habr.com/ru/hubs/programming/articles/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/hub/programming/',
          hint: { key: 'habr:hub', label: 'Hub' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a user page', () => {
      const value = 'https://habr.com/en/users/example/posts/'
      const expected = [
        {
          uri: 'https://habr.com/en/rss/users/example/posts/',
          hint: { key: 'habr:user', label: 'User' },
        },
        {
          uri: 'https://habr.com/en/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the company feed for a company page', () => {
      const value = 'https://habr.com/ru/companies/example/articles/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/companies/example/articles/',
          hint: { key: 'habr:company', label: 'Company' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should fall back to the default language', () => {
      const value = 'https://habr.com/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(habrHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
