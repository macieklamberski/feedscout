import { describe, expect, it } from 'bun:test'
import type { MediumUrl } from './medium.js'
import { mediumHandler, parseMediumUrl } from './medium.js'

describe('parseMediumUrl', () => {
  it('should return the user for a profile', () => {
    const expected: MediumUrl = { kind: 'user', username: 'ev' }

    expect(parseMediumUrl('https://medium.com/@ev')).toEqual(expected)
  })

  it('should return the user for a profile article', () => {
    const expected: MediumUrl = { kind: 'user', username: 'ev' }

    expect(parseMediumUrl('https://medium.com/@ev/some-article')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: MediumUrl = { kind: 'user', username: 'ev' }

    expect(parseMediumUrl('https://www.medium.com/@ev')).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: MediumUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMediumUrl('https://medium.com/tag/javascript')).toEqual(expected)
  })

  it('should return the tag for a tag page with a capitalized tag segment', () => {
    const expected: MediumUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMediumUrl('https://medium.com/Tag/javascript')).toEqual(expected)
  })

  it('should return the publication for a publication page', () => {
    const expected: MediumUrl = { kind: 'publication', publication: 'towards-data-science' }

    expect(parseMediumUrl('https://medium.com/towards-data-science')).toEqual(expected)
  })

  it('should return the publication for a publication on the www host', () => {
    const expected: MediumUrl = { kind: 'publication', publication: 'towards-data-science' }

    expect(parseMediumUrl('https://www.medium.com/towards-data-science')).toEqual(expected)
  })

  it('should return the publication for a numeric-only publication name', () => {
    const expected: MediumUrl = { kind: 'publication', publication: '12345' }

    expect(parseMediumUrl('https://medium.com/12345')).toEqual(expected)
  })

  it('should return the publication and tag for a publication tagged page', () => {
    const value = 'https://medium.com/towards-data-science/tagged/machine-learning'
    const expected: MediumUrl = {
      kind: 'publication',
      publication: 'towards-data-science',
      tag: 'machine-learning',
    }

    expect(parseMediumUrl(value)).toEqual(expected)
  })

  it('should return the subdomain for a subdomain page', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'blog' }

    expect(parseMediumUrl('https://blog.medium.com/some-article')).toEqual(expected)
  })

  it('should return the subdomain for a subdomain root', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'blog' }

    expect(parseMediumUrl('https://blog.medium.com')).toEqual(expected)
  })

  it('should return the subdomain and tag for a subdomain tagged page', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'blog', tag: 'engineering' }

    expect(parseMediumUrl('https://blog.medium.com/tagged/engineering')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseMediumUrl('https://a.b.medium.com')).toBeUndefined()
  })

  it('should return undefined for system subdomains', () => {
    expect(parseMediumUrl('https://help.medium.com/hc/en-us')).toBeUndefined()
    expect(parseMediumUrl('https://miro.medium.com/v2/resize:fit:200/1*abc.png')).toBeUndefined()
  })

  it('should return undefined for excluded paths', () => {
    expect(parseMediumUrl('https://medium.com/search')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/me')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/new-story')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/plans')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/membership')).toBeUndefined()
  })

  it('should return undefined for excluded paths in tagged URLs', () => {
    expect(parseMediumUrl('https://medium.com/search/tagged/javascript')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/me/tagged/react')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/plans/tagged/python')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/membership/tagged/writing')).toBeUndefined()
  })

  it('should return undefined for an excluded path in any case', () => {
    expect(parseMediumUrl('https://medium.com/Search')).toBeUndefined()
  })

  it('should return undefined for feed URLs', () => {
    expect(parseMediumUrl('https://medium.com/feed/the-startup')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseMediumUrl('https://medium.com')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMediumUrl('https://example.com/@ev')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseMediumUrl('not-a-url')).toBeUndefined()
  })
})

describe('mediumHandler', () => {
  describe('match', () => {
    it('should match a medium.com URL', () => {
      expect(mediumHandler.match('https://medium.com/@ev')).toBe(true)
    })

    it('should not match another host', () => {
      expect(mediumHandler.match('https://example.com/@ev')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://medium.com/@ev'
      const expected = [
        { uri: 'https://medium.com/feed/@ev', hint: { key: 'medium:posts', label: 'Posts' } },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication', () => {
      const value = 'https://medium.com/towards-data-science'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain publication', () => {
      const value = 'https://blog.medium.com/some-article'
      const expected = [
        {
          uri: 'https://blog.medium.com/feed',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://medium.com/tag/javascript'
      const expected = [
        {
          uri: 'https://medium.com/feed/tag/javascript',
          hint: { key: 'medium:tag', label: 'Tag' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication tagged page', () => {
      const value = 'https://medium.com/towards-data-science/tagged/machine-learning'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science/tagged/machine-learning',
          hint: { key: 'medium:tagged', label: 'Tagged' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain tagged page', () => {
      const value = 'https://blog.medium.com/tagged/engineering'
      const expected = [
        {
          uri: 'https://blog.medium.com/feed/tagged/engineering',
          hint: { key: 'medium:tagged', label: 'Tagged' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://medium.com/'

      expect(mediumHandler.resolve(value)).toEqual([])
    })
  })
})
