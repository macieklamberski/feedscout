import { describe, expect, it } from 'bun:test'
import { diasporaHandler, isDiasporaHtml } from './diaspora.js'

const diasporaHtml = '<script>Diaspora.Page = new Diaspora.Pages.Profile();</script>'
const otherHtml = `
  <meta
    property="og:site_name"
    content="diaspora* social network"
  >
`

describe('isDiasporaHtml', () => {
  it('should return true for the Diaspora.Page global', () => {
    expect(isDiasporaHtml(diasporaHtml)).toBe(true)
  })

  it('should return false for the site name alone', () => {
    expect(isDiasporaHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isDiasporaHtml('')).toBe(false)
  })
})

describe('diasporaHandler', () => {
  describe('match', () => {
    it('should match a profile path', () => {
      expect(diasporaHandler.match('https://example.org/u/alice', diasporaHtml)).toBe(true)
    })

    it('should match the feed and legacy profile paths', () => {
      expect(diasporaHandler.match('https://example.org/public/alice', diasporaHtml)).toBe(true)
      expect(diasporaHandler.match('https://example.org/people/alice', diasporaHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(diasporaHandler.match('https://example.org/u/alice')).toBe(false)
    })

    it('should not match the pod root', () => {
      expect(diasporaHandler.match('https://example.org/', diasporaHtml)).toBe(false)
    })

    it('should not match other paths', () => {
      expect(diasporaHandler.match('https://example.org/stream', diasporaHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(diasporaHandler.match('not-a-url', diasporaHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the public feed for a profile path', () => {
      const value = 'https://example.org/u/alice'
      const expected = [
        {
          uri: 'https://example.org/public/alice',
          hint: { key: 'diaspora:posts', label: 'Posts' },
        },
      ]

      expect(diasporaHandler.resolve(value)).toEqual(expected)
    })

    it('should return the public feed for a feed path', () => {
      const value = 'https://example.org/public/alice'
      const expected = [
        {
          uri: 'https://example.org/public/alice',
          hint: { key: 'diaspora:posts', label: 'Posts' },
        },
      ]

      expect(diasporaHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the pod root', () => {
      expect(diasporaHandler.resolve('https://example.org/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(diasporaHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
