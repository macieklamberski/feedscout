import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HautetfortUrl, hautetfortHandler, parseHautetfortUrl } from './hautetfort.js'

describe('parseHautetfortUrl', () => {
  const values: Array<[string, HautetfortUrl]> = [
    ['http://litteraturedepartout.hautetfort.com/', { kind: 'blog', blog: 'litteraturedepartout' }],
    ['http://cfabtpduloiret.blogspirit.com/', { kind: 'blog', blog: 'cfabtpduloiret' }],
    [
      'http://institutmauricegarcon.blog.blogspirit-business.com/',
      { kind: 'blog', blog: 'institutmauricegarcon' },
    ],
    [
      'http://vouloir.hautetfort.com/archive/2016/06/15/roger-viroux-5815631.html',
      { kind: 'blog', blog: 'vouloir' },
    ],
    ['http://vouloir.hautetfort.com/about.html', { kind: 'blog', blog: 'vouloir' }],
    [
      'http://vouloir.hautetfort.com/histoire/',
      { kind: 'category', blog: 'vouloir', category: 'histoire' },
    ],
    [
      'http://vouloir.hautetfort.com/a_contre-temps',
      { kind: 'category', blog: 'vouloir', category: 'a_contre-temps' },
    ],
    [
      'http://vouloir.hautetfort.com/archives/category/histoire/index-2.html',
      { kind: 'category', blog: 'vouloir', category: 'histoire' },
    ],
  ]

  it.each(values)('should parse %s', (url, expected) => {
    expect(parseHautetfortUrl(url)).toEqual(expected)
  })

  const unmatched: Array<string> = [
    'https://www.hautetfort.com/',
    'https://www.hautetfort.com/explore/posts/tag/graveyard',
    'https://www.blogspirit.com/en/index.php',
    'https://hautetfort.com/',
    'https://www.vouloir.hautetfort.com/',
    'https://www.vouloir.blogspirit.com/',
    'https://example.com/histoire/',
    'not-a-url',
  ]

  it.each(unmatched)('should return undefined for %s', (url) => {
    expect(parseHautetfortUrl(url)).toBeUndefined()
  })
})

describe('hautetfortHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(hautetfortHandler.match('http://litteraturedepartout.hautetfort.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(hautetfortHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(hautetfortHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the blog feeds on http for a blog page', () => {
      const value = 'https://cfabtpduloiret.blogspirit.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://cfabtpduloiret.blogspirit.com/atom.xml',
          hint: { key: 'hautetfort:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://cfabtpduloiret.blogspirit.com/index.rss',
          hint: { key: 'hautetfort:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(hautetfortHandler.resolve(value)).toEqual(expected)
    })

    it('should return the category feed and the blog feeds for a category page', () => {
      const value = 'http://vouloir.hautetfort.com/histoire/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://vouloir.hautetfort.com/histoire/index.rss',
          hint: { key: 'hautetfort:category', label: 'Category' },
        },
        {
          uri: 'http://vouloir.hautetfort.com/atom.xml',
          hint: { key: 'hautetfort:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://vouloir.hautetfort.com/index.rss',
          hint: { key: 'hautetfort:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(hautetfortHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the category hint for a category feed', () => {
      const value = 'http://pourunefranceforteetcatholique.hautetfort.com/web/index.rss'
      const expected: DiscoverUriHint = { key: 'hautetfort:category', label: 'Category' }

      expect(hautetfortHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed on blogspirit.com', () => {
      const value = 'http://actionbarbes.blogspirit.com/dans-le-18eme/index.rss'
      const expected: DiscoverUriHint = { key: 'hautetfort:category', label: 'Category' }

      expect(hautetfortHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RSS feed', () => {
      const value = 'http://vouloir.hautetfort.com/index.rss'
      const expected: DiscoverUriHint = { key: 'hautetfort:posts', label: 'Posts', format: 'rss' }

      expect(hautetfortHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'http://cfabtpduloiret.blogspirit.com/atom.xml'
      const expected: DiscoverUriHint = { key: 'hautetfort:posts', label: 'Posts', format: 'atom' }

      expect(hautetfortHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed on blog.blogspirit-business.com', () => {
      const value = 'http://institutmauricegarcon.blog.blogspirit-business.com/index.rss'
      const expected: DiscoverUriHint = { key: 'hautetfort:posts', label: 'Posts', format: 'rss' }

      expect(hautetfortHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a category page', () => {
      const value = 'http://vouloir.hautetfort.com/histoire/'

      expect(hautetfortHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'http://blog.vouloir.hautetfort.com/index.rss'

      expect(hautetfortHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.hautetfort.com/index.rss'

      expect(hautetfortHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/histoire/index.rss'

      expect(hautetfortHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://pourunefranceforteetcatholique.hautetfort.com/web/index.rss',
        { key: 'hautetfort:category', label: 'Category' },
      ],
      [
        'http://actionbarbes.blogspirit.com/dans-le-18eme/index.rss',
        { key: 'hautetfort:category', label: 'Category' },
      ],
      [
        'http://vouloir.hautetfort.com/index.rss',
        { key: 'hautetfort:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://cfabtpduloiret.blogspirit.com/atom.xml',
        { key: 'hautetfort:posts', label: 'Posts', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [hautetfortHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
