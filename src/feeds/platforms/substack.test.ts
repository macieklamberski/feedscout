import { describe, expect, it } from 'bun:test'
import { parseSubstackUrl, type SubstackUrl, substackHandler } from './substack.js'

describe('parseSubstackUrl', () => {
  it('should return the newsletter for a publication subdomain', () => {
    const expected: SubstackUrl = { kind: 'newsletter' }

    expect(parseSubstackUrl('https://example.substack.com/p/post')).toEqual(expected)
  })

  it('should return the profile for a profile page', () => {
    const expected: SubstackUrl = { kind: 'profile', username: 'example' }

    expect(parseSubstackUrl('https://substack.com/@example')).toEqual(expected)
  })

  it('should return undefined for an apex page without a profile path', () => {
    expect(parseSubstackUrl('https://substack.com/home')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSubstackUrl('https://example.com/@example')).toBeUndefined()
  })
})

describe('substackHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.substack.com'],
      [true, 'https://blog.example.substack.com'],
      [true, 'https://substack.com/@alice'],
      [true, 'https://substack.com/@bob'],
      [true, 'https://substack.com/@user-name'],
      [false, 'https://substack.com/home'],
      [false, 'https://substack.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(substackHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(substackHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for newsletter', () => {
      const value = 'https://example.substack.com'
      const expected = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://example.substack.com/p/some-article'
      const expected = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for profile page', () => {
      const value = 'https://substack.com/@alice'
      const expected = [
        {
          uri: 'https://alice.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return the custom domain feed a profile page names', () => {
      const value = 'https://substack.com/@alice'
      const content =
        '{\\"primaryPublication\\":{\\"id\\":4330724,\\"subdomain\\":\\"alicewrites\\",\\"custom_domain\\":\\"newsletter.example.com\\"}}'
      const expected = [
        {
          uri: 'https://newsletter.example.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the publication subdomain feed when it differs from the handle', () => {
      const value = 'https://substack.com/@alice'
      const content =
        '{"primaryPublication":{"id":4330724,"subdomain":"alicewrites","custom_domain":null}}'
      const expected = [
        {
          uri: 'https://alicewrites.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return feed URL for profile page with subpath', () => {
      const value = 'https://substack.com/@bob/recommendations'
      const expected = [
        {
          uri: 'https://bob.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for an apex URL without a profile path', () => {
      expect(substackHandler.resolve('https://substack.com/home')).toEqual([])
    })
  })
})
