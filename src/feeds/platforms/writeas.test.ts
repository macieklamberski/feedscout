import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseWriteasUrl, type WriteasUrl, writeasHandler } from './writeas.js'

describe('parseWriteasUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: WriteasUrl = { kind: 'tag', username: 'matt', tag: 'writing' }

    expect(parseWriteasUrl('https://write.as/matt/tag:writing')).toEqual(expected)
  })

  it('should return the blog for a blog page', () => {
    const expected: WriteasUrl = { kind: 'blog', username: 'matt' }

    expect(parseWriteasUrl('https://write.as/matt')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseWriteasUrl('https://write.as/')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseWriteasUrl('https://write.as/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseWriteasUrl('https://example.com/matt')).toBeUndefined()
  })
})

describe('writeasHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://write.as/matt'],
      [true, 'https://www.write.as/user'],
      [false, 'https://write.as'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(writeasHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(writeasHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Write.as', () => {
      expect(writeasHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://write.as/matt'
      const expected = [
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://write.as/matt/some-post-slug'
      const expected = [
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page', () => {
      const value = 'https://write.as/matt/tag:reading'
      const expected = [
        {
          uri: 'https://write.as/matt/tag:reading/feed/',
          hint: { key: 'writeas:tag', label: 'Tag' },
        },
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page with a capitalized tag segment', () => {
      const value = 'https://write.as/matt/Tag:reading'
      const expected = [
        {
          uri: 'https://write.as/matt/tag:reading/feed/',
          hint: { key: 'writeas:tag', label: 'Tag' },
        },
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://write.as/'

      expect(writeasHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for a blog feed', () => {
      const value = 'https://write.as/matt/feed/'
      const expected: DiscoverUriHint = { key: 'writeas:blog', label: 'Blog' }

      expect(writeasHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog feed without a trailing slash', () => {
      const value = 'https://write.as/matt/feed'
      const expected: DiscoverUriHint = { key: 'writeas:blog', label: 'Blog' }

      expect(writeasHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog feed over http', () => {
      const value = 'http://write.as/matt/feed/'
      const expected: DiscoverUriHint = { key: 'writeas:blog', label: 'Blog' }

      expect(writeasHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://write.as/carol/tag:mindset/feed/'
      const expected: DiscoverUriHint = { key: 'writeas:tag', label: 'Tag' }

      expect(writeasHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed with an encoded tag', () => {
      const value = 'https://write.as/bob/tag:s%C3%B6dermalm/feed/'
      const expected: DiscoverUriHint = { key: 'writeas:tag', label: 'Tag' }

      expect(writeasHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://write.as/matt'

      expect(writeasHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://write.as/carol/tag:mindset'

      expect(writeasHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a dotted first segment', () => {
      const value = 'https://write.as/abcde12345fgh.md/feed/'

      expect(writeasHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/matt/feed/'

      expect(writeasHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://write.as/matt/feed/', { key: 'writeas:blog', label: 'Blog' }],
      ['https://write.as/carol/tag:mindset/feed/', { key: 'writeas:tag', label: 'Tag' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [writeasHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
