import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PchomeUrl, parsePchomeUrl, pchomeHandler } from './pchome.js'

describe('parsePchomeUrl', () => {
  it('should return the paper for a paper page', () => {
    const expected: PchomeUrl = { kind: 'paper', username: 'alice' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/alice')).toEqual(expected)
  })

  it('should return the paper for a post page', () => {
    const expected: PchomeUrl = { kind: 'paper', username: 'alice' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/alice/post/1312381664')).toEqual(expected)
  })

  it('should return the paper for a mobile paper page', () => {
    const expected: PchomeUrl = { kind: 'paper', username: 'alice' }

    expect(parsePchomeUrl('https://mypaper.m.pchome.com.tw/alice')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const expected: PchomeUrl = { kind: 'category', username: 'alice', category: '14' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/alice/category/14')).toEqual(expected)
  })

  it('should return the category for a mobile category page', () => {
    const expected: PchomeUrl = { kind: 'category', username: 'alice', category: '14' }

    expect(parsePchomeUrl('https://mypaper.m.pchome.com.tw/alice/category/14')).toEqual(expected)
  })

  it('should return the category for a capitalized category segment', () => {
    const expected: PchomeUrl = { kind: 'category', username: 'alice', category: '14' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/alice/Category/14')).toEqual(expected)
  })

  it('should keep the case of the username', () => {
    const expected: PchomeUrl = { kind: 'paper', username: 'Alice_01' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/Alice_01')).toEqual(expected)
  })

  it('should return the paper when the category id is not a number', () => {
    const expected: PchomeUrl = { kind: 'paper', username: 'alice' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/alice/category/new')).toEqual(expected)
  })

  it('should return the paper for a category segment without an id', () => {
    const expected: PchomeUrl = { kind: 'paper', username: 'alice' }

    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/alice/category')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/')).toBeUndefined()
  })

  it('should return undefined for a site-wide listing', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/index/newest-paper')).toBeUndefined()
  })

  it('should return undefined for the posting panel', () => {
    expect(parsePchomeUrl('https://mypaper.m.pchome.com.tw/panel/content_add')).toBeUndefined()
  })

  it('should return undefined for the mobile listing', () => {
    expect(parsePchomeUrl('https://mypaper.m.pchome.com.tw/s/1')).toBeUndefined()
  })

  it('should return undefined for the search page', () => {
    expect(parsePchomeUrl('https://mypaper.m.pchome.com.tw/search_mypaper/')).toBeUndefined()
  })

  it('should return undefined for an image view', () => {
    const value = 'https://mypaper.pchome.com.tw/show/article/alice/A1312381664'

    expect(parsePchomeUrl(value)).toBeUndefined()
  })

  it('should return undefined for a stylesheet', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/css/topstyle.css')).toBeUndefined()
  })

  it('should return undefined for an uploaded file', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/public_file/alice/1.jpg')).toBeUndefined()
  })

  it('should return undefined for a script', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/js/common.js')).toBeUndefined()
  })

  it('should return undefined for an image asset', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/img/logo.png')).toBeUndefined()
  })

  it('should return undefined for the lightbox assets', () => {
    expect(
      parsePchomeUrl('https://mypaper.pchome.com.tw/fancybox/jquery.fancybox.css'),
    ).toBeUndefined()
  })

  it('should return undefined for a file at the root', () => {
    expect(parsePchomeUrl('https://mypaper.pchome.com.tw/oops.htm')).toBeUndefined()
  })

  it('should return undefined for another PChome host', () => {
    expect(parsePchomeUrl('https://www.pchome.com.tw/alice')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePchomeUrl('https://example.com/alice')).toBeUndefined()
  })
})

describe('pchomeHandler', () => {
  describe('match', () => {
    it('should match a paper page', () => {
      expect(pchomeHandler.match('https://mypaper.pchome.com.tw/alice')).toBe(true)
    })

    it('should not match another host', () => {
      expect(pchomeHandler.match('https://example.com/alice')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside PChome', () => {
      expect(pchomeHandler.resolve('https://example.com/alice')).toEqual([])
    })

    it('should return the posts feed for a paper page', () => {
      const value = 'https://mypaper.m.pchome.com.tw/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://mypaper.pchome.com.tw/alice/rss',
          hint: { key: 'pchome:posts', label: 'Posts' },
        },
      ]

      expect(pchomeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the category and posts feeds for a category page', () => {
      const value = 'https://mypaper.pchome.com.tw/alice/category/14'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://mypaper.pchome.com.tw/alice/rss?cid=14',
          hint: { key: 'pchome:category', label: 'Category' },
        },
        {
          uri: 'https://mypaper.pchome.com.tw/alice/rss',
          hint: { key: 'pchome:posts', label: 'Posts' },
        },
      ]

      expect(pchomeHandler.resolve(value)).toEqual(expected)
    })
  })
})
