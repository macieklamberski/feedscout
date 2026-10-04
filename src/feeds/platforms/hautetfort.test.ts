import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type HautetfortUrl, hautetfortHandler, parseHautetfortUrl } from './hautetfort.js'

describe('parseHautetfortUrl', () => {
  const values: Array<[string, HautetfortUrl]> = [
    ['http://litteraturedepartout.hautetfort.com/', { kind: 'blog', blog: 'litteraturedepartout' }],
    ['http://cfabtpduloiret.blogspirit.com/', { kind: 'blog', blog: 'cfabtpduloiret' }],
    [
      'http://institutmauricegarcon.blog.blogspirit-business.com/',
      { kind: 'blog', blog: 'institutmauricegarcon.blog' },
    ],
    [
      'http://vouloir.hautetfort.com/archive/2016/06/15/roger-viroux-5815631.html',
      { kind: 'blog', blog: 'vouloir' },
    ],
    ['http://vouloir.hautetfort.com/archives', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/about.html', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/admin/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/album/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/apps/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/archive/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/backend/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/files/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/media/', { kind: 'blog', blog: 'vouloir' }],
    ['http://vouloir.hautetfort.com/tag/', { kind: 'blog', blog: 'vouloir' }],
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
    'https://starter.blogspirit.com/fr/tag/hermitage',
    'https://www.blogspirit.com/en/index.php',
    'https://static.hautetfort.com/backend/graphics/favicon.ico',
    'https://hautetfort.com/',
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
})
