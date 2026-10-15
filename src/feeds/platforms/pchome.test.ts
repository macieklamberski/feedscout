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
