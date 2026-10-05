import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type CanpanUrl, canpanHandler, parseCanpanUrl } from './canpan.js'

describe('parseCanpanUrl', () => {
  it('should return the blog for a blog home page', () => {
    const expected: CanpanUrl = { kind: 'blog', blog: 'alice' }

    expect(parseCanpanUrl('https://blog.canpan.info/alice/')).toEqual(expected)
  })

  it('should return the blog for an entry page', () => {
    const expected: CanpanUrl = { kind: 'blog', blog: 'alice' }

    expect(parseCanpanUrl('https://blog.canpan.info/alice/archive/573')).toEqual(expected)
  })

  it('should lowercase the blog', () => {
    const expected: CanpanUrl = { kind: 'blog', blog: 'alice_blog' }

    expect(parseCanpanUrl('https://blog.canpan.info/Alice_Blog/')).toEqual(expected)
  })

  it('should return the blog for an http URL', () => {
    const expected: CanpanUrl = { kind: 'blog', blog: 'alice' }

    expect(parseCanpanUrl('http://blog.canpan.info/alice/')).toEqual(expected)
  })

  it('should return undefined for an excluded path', () => {
    expect(parseCanpanUrl('https://blog.canpan.info/_common/css/common-header.css')).toBeUndefined()
    expect(parseCanpanUrl('https://blog.canpan.info/_contents/')).toBeUndefined()
    expect(parseCanpanUrl('https://blog.canpan.info/_pages/js/user')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseCanpanUrl('https://blog.canpan.info/IMG/ogp_logo.png')).toBeUndefined()
  })

  it('should return undefined for the host root', () => {
    expect(parseCanpanUrl('https://blog.canpan.info/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCanpanUrl('https://fields.canpan.info/alice/')).toBeUndefined()
    expect(parseCanpanUrl('https://example.com/alice/')).toBeUndefined()
  })
})

describe('canpanHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(canpanHandler.match('https://blog.canpan.info/alice/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(canpanHandler.match('https://example.com/alice/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS 2.0 and RDF feeds for blog', () => {
      const value = 'https://blog.canpan.info/alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.canpan.info/alice/index2_0.xml',
          hint: { key: 'canpan:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.canpan.info/alice/index1_0.rdf',
          hint: { key: 'canpan:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(canpanHandler.resolve(value)).toEqual(expected)
    })

    it('should return lowercase feeds for a mixed-case blog', () => {
      const value = 'https://blog.canpan.info/Alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.canpan.info/alice/index2_0.xml',
          hint: { key: 'canpan:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.canpan.info/alice/index1_0.rdf',
          hint: { key: 'canpan:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(canpanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array when the URL names no blog', () => {
      expect(canpanHandler.resolve('https://blog.canpan.info/')).toEqual([])
    })
  })
})
