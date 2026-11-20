import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type Fc2Url, fc2Handler, parseFc2Url } from './fc2.js'

describe('parseFc2Url', () => {
  it('should return the blog for a blog host', () => {
    const expected: Fc2Url = { kind: 'blog' }

    expect(parseFc2Url('https://someone.blog.fc2.com/')).toEqual(expected)
  })

  it('should return the blog for a numbered blog host', () => {
    const expected: Fc2Url = { kind: 'blog' }

    expect(parseFc2Url('https://someone.blog123.fc2.com/')).toEqual(expected)
  })

  it('should return the blog for an fc2.net host', () => {
    const expected: Fc2Url = { kind: 'blog' }

    expect(parseFc2Url('https://someone.fc2.net/')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const value = 'https://someone.blog.fc2.com/blog-category-12-2.html'
    const expected: Fc2Url = { kind: 'category', category: '12' }

    expect(parseFc2Url(value)).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const value = 'https://someone.fc2.net/?tag=%E6%97%85'
    const expected: Fc2Url = { kind: 'tag', tag: '旅' }

    expect(parseFc2Url(value)).toEqual(expected)
  })

  it('should return undefined for a dotted subdomain of a blog host', () => {
    expect(parseFc2Url('https://www.someone.blog.fc2.com/')).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain of an fc2.net blog host', () => {
    expect(parseFc2Url('https://www.someone.fc2.net/')).toBeUndefined()
  })

  it('should return undefined for the www host of a blog host', () => {
    expect(parseFc2Url('https://www.blog.fc2.com/')).toBeUndefined()
  })

  it('should return undefined for the blog farm host itself', () => {
    expect(parseFc2Url('https://blog.fc2.com/')).toBeUndefined()
  })

  it('should return undefined for an fc2blog.us host', () => {
    expect(parseFc2Url('http://someone.blog126.fc2blog.us/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseFc2Url('https://fc2.com/')).toBeUndefined()
  })
})

describe('fc2Handler', () => {
  describe('match', () => {
    it('should match the canonical blog host', () => {
      expect(fc2Handler.match('https://example.blog.fc2.com/')).toBe(true)
    })

    it('should match a legacy numbered blog host', () => {
      expect(fc2Handler.match('http://example.blog26.fc2.com/')).toBe(true)
    })

    it('should not match other FC2 services', () => {
      expect(fc2Handler.match('https://example.web.fc2.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(fc2Handler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(fc2Handler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(fc2Handler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed on the host in hand', () => {
      const value = 'https://example.blog.fc2.com/blog-entry-1.html'
      const expected = [
        { uri: 'https://example.blog.fc2.com/?xml', hint: { key: 'fc2:posts', label: 'Posts' } },
        {
          uri: 'https://example.blog.fc2.com/?comment&xml',
          hint: { key: 'fc2:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.blog.fc2.com/?trackback&xml',
          hint: { key: 'fc2:trackbacks', label: 'Trackbacks' },
        },
      ]

      expect(fc2Handler.resolve(value)).toEqual(expected)
    })

    it('should return the category feed for a category page', () => {
      const value = 'http://example.blog26.fc2.com/blog-category-12.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.blog26.fc2.com/?category=12&xml',
          hint: { key: 'fc2:category', label: 'Category' },
        },
        { uri: 'http://example.blog26.fc2.com/?xml', hint: { key: 'fc2:posts', label: 'Posts' } },
        {
          uri: 'http://example.blog26.fc2.com/?comment&xml',
          hint: { key: 'fc2:comments', label: 'Comments' },
        },
        {
          uri: 'http://example.blog26.fc2.com/?trackback&xml',
          hint: { key: 'fc2:trackbacks', label: 'Trackbacks' },
        },
      ]

      expect(fc2Handler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a tag page', () => {
      const value = 'https://example.fc2.net/?tag=example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.fc2.net/?utag=example&xml',
          hint: { key: 'fc2:tag', label: 'Tag' },
        },
        { uri: 'https://example.fc2.net/?xml', hint: { key: 'fc2:posts', label: 'Posts' } },
        {
          uri: 'https://example.fc2.net/?comment&xml',
          hint: { key: 'fc2:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.fc2.net/?trackback&xml',
          hint: { key: 'fc2:trackbacks', label: 'Trackbacks' },
        },
      ]

      expect(fc2Handler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the blog', () => {
      const value = 'http://example.blog26.fc2.com/'
      const expected = [
        { uri: 'http://example.blog26.fc2.com/?xml', hint: { key: 'fc2:posts', label: 'Posts' } },
        {
          uri: 'http://example.blog26.fc2.com/?comment&xml',
          hint: { key: 'fc2:comments', label: 'Comments' },
        },
        {
          uri: 'http://example.blog26.fc2.com/?trackback&xml',
          hint: { key: 'fc2:trackbacks', label: 'Trackbacks' },
        },
      ]

      expect(fc2Handler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the comments hint for a comments feed with the parameters reordered', () => {
      const value = 'https://example.blog26.fc2.com/?comment=&xml='
      const expected: DiscoverUriHint = { key: 'fc2:comments', label: 'Comments' }

      expect(fc2Handler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a comments feed on a numbered blog host as itself', async () => {
      const value = 'http://example.blog26.fc2.com/?comment=&xml='
      const options = {
        ...defaultPlatformOptions,
        handlers: [fc2Handler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.blog26.fc2.com/?comment=&xml=',
          hint: { key: 'fc2:comments', label: 'Comments' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
