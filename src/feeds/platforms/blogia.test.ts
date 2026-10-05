import { describe, expect, it } from 'bun:test'
import { type BlogiaUrl, blogiaHandler, parseBlogiaUrl } from './blogia.js'

describe('parseBlogiaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BlogiaUrl = { kind: 'blog', blog: 'alice' }

    expect(parseBlogiaUrl('https://alice.blogia.com/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: BlogiaUrl = { kind: 'blog', blog: 'alice' }

    expect(parseBlogiaUrl('https://alice.blogia.com/2020/042201-el-techo-.php')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseBlogiaUrl('https://blogia.com/')).toBeUndefined()
  })

  const excludedUrls = [
    'https://www.blogia.com/',
    'https://cms.blogia.com/templates/template1/css/styles.css',
    'https://mail.blogia.com/',
  ]

  it.each(excludedUrls)('should return undefined for the service host %s', (url) => {
    expect(parseBlogiaUrl(url)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBlogiaUrl('https://example.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseBlogiaUrl('https://www.alice.blogia.com/')).toBeUndefined()
  })
})

describe('blogiaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.blogia.com/'],
      [false, 'https://www.blogia.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(blogiaHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return the https posts feed for an http page', () => {
      const value = 'http://alice.blogia.com/temas/reflexiones/'
      const expected = [
        {
          uri: 'https://alice.blogia.com/feed.xml',
          hint: { key: 'blogia:posts', label: 'Posts' },
        },
      ]

      expect(blogiaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for an excluded subdomain', () => {
      expect(blogiaHandler.resolve('https://www.blogia.com/')).toEqual([])
    })
  })
})
