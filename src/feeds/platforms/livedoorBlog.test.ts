import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { LivedoorBlogUrl } from './livedoorBlog.js'
import { livedoorBlogHandler, parseLivedoorBlogUrl } from './livedoorBlog.js'

describe('parseLivedoorBlogUrl', () => {
  const blogUrls = [
    'https://example.blog.jp/',
    'https://example.doorblog.jp/',
    'https://example.ldblog.jp/',
    'https://example.livedoor.biz/',
  ]

  it.each(blogUrls)('should return the blog for %s', (url) => {
    const expected: LivedoorBlogUrl = { kind: 'blog', blog: 'example' }

    expect(parseLivedoorBlogUrl(url)).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: LivedoorBlogUrl = { kind: 'blog', blog: 'example' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/archives/12345678.html')).toEqual(expected)
  })

  it('should return the blog and category for a category page', () => {
    const expected: LivedoorBlogUrl = { kind: 'category', blog: 'example', category: '184845' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/archives/cat_184845.html')).toEqual(
      expected,
    )
  })

  it('should return the category for a category page with capitalized route words', () => {
    const expected: LivedoorBlogUrl = { kind: 'category', blog: 'example', category: '184845' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/Archives/Cat_184845.html')).toEqual(
      expected,
    )
  })

  it('should return the blog when the category id runs into letters', () => {
    const expected: LivedoorBlogUrl = { kind: 'blog', blog: 'example' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/archives/cat_184845x.html')).toEqual(
      expected,
    )
  })

  it('should return undefined for the apex domain', () => {
    expect(parseLivedoorBlogUrl('https://blog.jp/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseLivedoorBlogUrl('https://www.blog.jp/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseLivedoorBlogUrl('https://www.example.blog.jp/')).toBeUndefined()
  })

  it('should return undefined for a host ending in blog.jp without the dot', () => {
    expect(parseLivedoorBlogUrl('https://example.hatenablog.jp/')).toBeUndefined()
  })

  it('should return undefined for blog.livedoor.jp', () => {
    expect(parseLivedoorBlogUrl('https://blog.livedoor.jp/example/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLivedoorBlogUrl('not-a-url')).toBeUndefined()
  })
})

describe('livedoorBlogHandler', () => {
  describe('match', () => {
    it('should match a Livedoor Blog URL', () => {
      expect(livedoorBlogHandler.match('https://example.livedoor.biz/')).toBe(true)
    })

    it('should not match the apex domain', () => {
      expect(livedoorBlogHandler.match('https://livedoor.biz/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RDF and Atom feeds for blog', () => {
      const value = 'https://example.doorblog.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.doorblog.jp/index.rdf',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.doorblog.jp/atom.xml',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(livedoorBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds under the page scheme for an http page', () => {
      const value = 'http://example.ldblog.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.ldblog.jp/index.rdf',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'http://example.ldblog.jp/atom.xml',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(livedoorBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category and posts feeds for category page', () => {
      const value = 'https://example.blog.jp/archives/cat_184845.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blog.jp/archives/cat_184845.xml',
          hint: { key: 'livedoor-blog:category', label: 'Category', format: 'rdf' },
        },
        {
          uri: 'https://example.blog.jp/index.rdf',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.blog.jp/atom.xml',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(livedoorBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the apex domain', () => {
      expect(livedoorBlogHandler.resolve('https://blog.jp/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the category hint for a category feed on blog.jp', () => {
      const value = 'https://atrpg.blog.jp/archives/cat_601340.xml'
      const expected: DiscoverUriHint = {
        key: 'livedoor-blog:category',
        label: 'Category',
        format: 'rdf',
      }

      expect(livedoorBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed with a hyphenated blog name', () => {
      const value = 'https://digimonlinkz-matome.blog.jp/archives/cat_103964.xml'
      const expected: DiscoverUriHint = {
        key: 'livedoor-blog:category',
        label: 'Category',
        format: 'rdf',
      }

      expect(livedoorBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed on livedoor.biz', () => {
      const value = 'https://example.livedoor.biz/archives/cat_184845.xml'
      const expected: DiscoverUriHint = {
        key: 'livedoor-blog:category',
        label: 'Category',
        format: 'rdf',
      }

      expect(livedoorBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for an http category feed', () => {
      const value = 'http://example.doorblog.jp/archives/cat_184845.xml'
      const expected: DiscoverUriHint = {
        key: 'livedoor-blog:category',
        label: 'Category',
        format: 'rdf',
      }

      expect(livedoorBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RDF feed', () => {
      const value = 'https://example.ldblog.jp/index.rdf'
      const expected: DiscoverUriHint = {
        key: 'livedoor-blog:posts',
        label: 'Posts',
        format: 'rdf',
      }

      expect(livedoorBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://example.blog.jp/atom.xml'
      const expected: DiscoverUriHint = {
        key: 'livedoor-blog:posts',
        label: 'Posts',
        format: 'atom',
      }

      expect(livedoorBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a category page', () => {
      const value = 'https://example.blog.jp/archives/cat_184845.html'

      expect(livedoorBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the blog home page', () => {
      const value = 'https://example.blog.jp/'

      expect(livedoorBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.blog.jp/index.rdf'

      expect(livedoorBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex domain', () => {
      const value = 'https://blog.jp/index.rdf'

      expect(livedoorBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a host ending in blog.jp without the dot', () => {
      const value = 'https://example.hatenablog.jp/atom.xml'

      expect(livedoorBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/index.rdf'

      expect(livedoorBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://atrpg.blog.jp/archives/cat_601340.xml',
        { key: 'livedoor-blog:category', label: 'Category', format: 'rdf' },
      ],
      [
        'https://digimonlinkz-matome.blog.jp/archives/cat_103964.xml',
        { key: 'livedoor-blog:category', label: 'Category', format: 'rdf' },
      ],
      [
        'https://example.ldblog.jp/index.rdf',
        { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
      ],
      [
        'https://example.blog.jp/atom.xml',
        { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [livedoorBlogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
