import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  it('should keep the blog case', () => {
    const expected: CanpanUrl = { kind: 'blog', blog: 'Alice_Blog' }

    expect(parseCanpanUrl('https://blog.canpan.info/Alice_Blog/')).toEqual(expected)
  })

  it('should return the blog for an http URL', () => {
    const expected: CanpanUrl = { kind: 'blog', blog: 'alice' }

    expect(parseCanpanUrl('http://blog.canpan.info/alice/')).toEqual(expected)
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

    it('should keep the case of a mixed-case blog', () => {
      const value = 'https://blog.canpan.info/Alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.canpan.info/Alice/index2_0.xml',
          hint: { key: 'canpan:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.canpan.info/Alice/index1_0.rdf',
          hint: { key: 'canpan:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(canpanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array when the URL names no blog', () => {
      expect(canpanHandler.resolve('https://blog.canpan.info/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS 2.0 feed', () => {
      const value = 'https://blog.canpan.info/alice/index2_0.xml'
      const expected = 'canpan:posts'

      expect(canpanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RDF feed', () => {
      const value = 'https://blog.canpan.info/alice/index1_0.rdf'
      const expected = 'canpan:posts'

      expect(canpanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http RSS 2.0 feed', () => {
      const value = 'http://blog.canpan.info/alice_example/index2_0.xml'
      const expected = 'canpan:posts'

      expect(canpanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http RDF feed', () => {
      const value = 'http://blog.canpan.info/alice-example/index1_0.rdf'
      const expected = 'canpan:posts'

      expect(canpanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://blog.canpan.info/alice/'

      expect(canpanHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an entry page', () => {
      const value = 'https://blog.canpan.info/alice/archive/573'

      expect(canpanHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another canpan host', () => {
      const value = 'https://fields.canpan.info/rss/topic_all.rdf'

      expect(canpanHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const values: Array<[string, DiscoverUriHint]> = [
      ['https://blog.canpan.info/alice/index2_0.xml', { key: 'canpan:posts', label: 'Posts' }],
      ['https://blog.canpan.info/alice/index1_0.rdf', { key: 'canpan:posts', label: 'Posts' }],
      ['http://blog.canpan.info/alice/index2_0.xml', { key: 'canpan:posts', label: 'Posts' }],
      ['http://blog.canpan.info/alice/index1_0.rdf', { key: 'canpan:posts', label: 'Posts' }],
    ]

    it.each(values)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [canpanHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
