import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseReformalUrl, type ReformalUrl, reformalHandler } from './reformal.js'

describe('parseReformalUrl', () => {
  it('should return the project for a reformal.ru subdomain', () => {
    const expected: ReformalUrl = { kind: 'project', project: 'example', domain: 'reformal.ru' }

    expect(parseReformalUrl('https://example.reformal.ru/')).toEqual(expected)
  })

  it('should return the project for an idea.informer.com subdomain', () => {
    const expected: ReformalUrl = {
      kind: 'project',
      project: 'example',
      domain: 'idea.informer.com',
    }

    expect(parseReformalUrl('https://example.idea.informer.com/')).toEqual(expected)
  })

  it('should return the project for a page inside the project', () => {
    const expected: ReformalUrl = { kind: 'project', project: 'example', domain: 'reformal.ru' }

    expect(parseReformalUrl('https://example.reformal.ru/proj/?ia=123456')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseReformalUrl('https://reformal.ru/')).toBeUndefined()
  })

  it('should return undefined for the idea.informer.com host', () => {
    expect(parseReformalUrl('https://idea.informer.com/')).toBeUndefined()
  })

  it('should return undefined for the www host of idea.informer.com', () => {
    expect(parseReformalUrl('https://www.idea.informer.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseReformalUrl('https://ideas.example.reformal.ru/')).toBeUndefined()
  })

  it('should return undefined for another informer.com host', () => {
    expect(parseReformalUrl('https://example.informer.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseReformalUrl('https://example.com/')).toBeUndefined()
  })
})

describe('reformalHandler', () => {
  describe('match', () => {
    it('should match a project subdomain', () => {
      expect(reformalHandler.match('https://example.reformal.ru/')).toBe(true)
    })

    it('should not match the www host', () => {
      expect(reformalHandler.match('https://www.reformal.ru/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the feedback feed for a reformal.ru project', () => {
      const value = 'https://example.reformal.ru/'
      const expected = [
        {
          uri: 'https://example.reformal.ru/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feedback feed for an idea.informer.com project', () => {
      const value = 'https://example.idea.informer.com/'
      const expected = [
        {
          uri: 'https://example.idea.informer.com/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feedback feed regardless of path', () => {
      const value = 'https://example.reformal.ru/proj/?ia=123456'
      const expected = [
        {
          uri: 'https://example.reformal.ru/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http project page', () => {
      const value = 'http://example.reformal.ru/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.reformal.ru/proj/rss',
          hint: { key: 'reformal:feedback', label: 'Feedback' },
        },
      ]

      expect(reformalHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Reformal', () => {
      expect(reformalHandler.resolve('https://example.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    const feedUrls = [
      'https://example.reformal.ru/proj/rss',
      'http://example.reformal.ru/proj/rss',
      'https://example.reformal.ru/proj/rss?ia=12345',
      'http://example.reformal.ru/proj/rss?ia=12345',
      'https://example.idea.informer.com/proj/rss',
      'https://example.idea.informer.com/proj/rss?ia=12345',
    ]

    it.each(feedUrls)('should return the feedback hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'reformal:feedback', label: 'Feedback' }

      expect(reformalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for an idea page', () => {
      const value = 'https://example.reformal.ru/proj/?ia=12345'

      expect(reformalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex domain', () => {
      const value = 'https://reformal.ru/proj/rss'

      expect(reformalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the idea.informer.com host', () => {
      const value = 'https://idea.informer.com/proj/rss'

      expect(reformalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://ideas.example.reformal.ru/proj/rss'

      expect(reformalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another informer.com host', () => {
      const value = 'https://example.informer.com/proj/rss'

      expect(reformalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/proj/rss'

      expect(reformalHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'reformal:feedback', label: 'Feedback' }
    const ownFeeds = [
      'https://example.reformal.ru/proj/rss',
      'http://example.reformal.ru/proj/rss?ia=12345',
      'https://example.idea.informer.com/proj/rss?ia=12345',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [reformalHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
