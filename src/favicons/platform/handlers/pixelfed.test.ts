import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { pixelfedHandler } from './pixelfed.js'

const pixelfedHtml = '<html><head><meta name="generator" content="pixelfed"></head></html>'
const profileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57"
      >
      <meta property="og:image:width" content="200">
      <meta name="application-name" content="Pixelfed">
      <meta name="generator" content="pixelfed">
    </head>
  </html>
`

describe('pixelfedHandler', () => {
  describe('match', () => {
    it('should match /{user} with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://example.com/alice', pixelfedHtml)).toBe(true)
    })

    it('should match /users/{user} with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://example.com/users/alice', pixelfedHtml)).toBe(true)
    })

    it('should not match profile path without Pixelfed content', () => {
      const value = '<meta name="generator" content="WordPress 6.0">'

      expect(pixelfedHandler.match('https://example.com/alice', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(pixelfedHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(pixelfedHandler.match('https://example.com/discover', pixelfedHtml)).toBe(false)
      expect(pixelfedHandler.match('https://example.com/settings', pixelfedHtml)).toBe(false)
    })

    it('should not match post paths', () => {
      expect(pixelfedHandler.match('https://example.com/p/alice/123', pixelfedHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(pixelfedHandler.match('not-a-url', pixelfedHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve avatar from og:image on /{user}', () => {
        const result = pixelfedHandler.resolve('https://example.com/alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve avatar from og:image on /users/{user}', () => {
        const result = pixelfedHandler.resolve('https://example.com/users/alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for excluded path', () => {
        const result = pixelfedHandler.resolve('https://example.com/discover', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        const result = pixelfedHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array without content', () => {
        const result = pixelfedHandler.resolve('https://example.com/alice')

        expect(result).toEqual([])
      })

      it('should return empty array when page has no og:image', () => {
        const result = pixelfedHandler.resolve('https://example.com/alice', pixelfedHtml)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return empty array for default avatar in og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/storage/avatars/default.jpg"
          >
        `
        const result = pixelfedHandler.resolve('https://example.com/alice', value)

        expect(result).toEqual([])
      })

      it('should return empty array for default avatar with query in og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/storage/avatars/default.png?v=0"
          >
        `
        const result = pixelfedHandler.resolve('https://example.com/alice', value)

        expect(result).toEqual([])
      })
    })
  })
})
