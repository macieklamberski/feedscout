import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BlogaliaUrl, blogaliaHandler, parseBlogaliaUrl } from './blogalia.js'

describe('parseBlogaliaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BlogaliaUrl = { kind: 'blog' }

    expect(parseBlogaliaUrl('https://example.blogalia.com/')).toEqual(expected)
  })

  it('should return the blog for a story page', () => {
    const expected: BlogaliaUrl = { kind: 'blog' }

    expect(parseBlogaliaUrl('https://example.blogalia.com/historias/12345')).toEqual(expected)
  })

  it('should return the blog for the www news blog', () => {
    const expected: BlogaliaUrl = { kind: 'blog' }

    expect(parseBlogaliaUrl('https://www.blogalia.com/')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseBlogaliaUrl('https://www.example.blogalia.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseBlogaliaUrl('https://blogalia.com/')).toBeUndefined()
  })

  it('should return undefined for a lookalike domain', () => {
    expect(parseBlogaliaUrl('https://example.blogia.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBlogaliaUrl('https://example.com/')).toBeUndefined()
  })
})

describe('blogaliaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.blogalia.com/'],
      [false, 'https://www.example.blogalia.com/'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(blogaliaHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Blogalia', () => {
      expect(blogaliaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RDF and RSS feeds for a blog', () => {
      const value = 'https://example.blogalia.com/historias/12345'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogalia.com/rdf.xml',
          hint: { key: 'blogalia:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.blogalia.com/rss20.xml',
          hint: { key: 'blogalia:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(blogaliaHandler.resolve(value)).toEqual(expected)
    })
  })
})
