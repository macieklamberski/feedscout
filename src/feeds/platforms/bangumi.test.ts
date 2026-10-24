import { describe, expect, it } from 'bun:test'
import type { BangumiUrl } from './bangumi.js'
import { bangumiHandler, parseBangumiUrl } from './bangumi.js'

describe('parseBangumiUrl', () => {
  it('should return the user for a user page', () => {
    const expected: BangumiUrl = { kind: 'user', username: 'sai' }

    expect(parseBangumiUrl('https://bgm.tv/user/sai')).toEqual(expected)
  })

  it('should return the user for a user page on bangumi.tv', () => {
    const expected: BangumiUrl = { kind: 'user', username: 'animeing' }

    expect(parseBangumiUrl('https://bangumi.tv/user/animeing')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: BangumiUrl = { kind: 'user', username: 'sai' }

    expect(parseBangumiUrl('https://bgm.tv/user/sai/timeline')).toEqual(expected)
  })

  it('should keep the case of a username', () => {
    const expected: BangumiUrl = { kind: 'user', username: 'Sai' }

    expect(parseBangumiUrl('https://bgm.tv/user/Sai')).toEqual(expected)
  })

  it('should return the user for a user page with a capitalized user segment', () => {
    const expected: BangumiUrl = { kind: 'user', username: 'sai' }

    expect(parseBangumiUrl('https://bgm.tv/User/sai')).toEqual(expected)
  })

  it('should return the home page for any other page', () => {
    const expected: BangumiUrl = { kind: 'home' }

    expect(parseBangumiUrl('https://bgm.tv/subject/253')).toEqual(expected)
  })

  it('should return the home page for the user route without a username', () => {
    const expected: BangumiUrl = { kind: 'home' }

    expect(parseBangumiUrl('https://bgm.tv/user/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseBangumiUrl('https://example.com/user/sai')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBangumiUrl('not a url')).toBeUndefined()
  })
})

describe('bangumiHandler', () => {
  describe('match', () => {
    it('should match a Bangumi page', () => {
      expect(bangumiHandler.match('https://bgm.tv/user/sai')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(bangumiHandler.match('https://example.com/user/sai')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Bangumi', () => {
      expect(bangumiHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the collections and timeline feeds for a user page', () => {
      const expected = [
        {
          uri: 'https://bgm.tv/feed/user/sai/interests',
          hint: { key: 'bangumi:collections', label: 'Collections' },
        },
        {
          uri: 'https://bgm.tv/feed/user/sai/timeline',
          hint: { key: 'bangumi:timeline', label: 'Timeline' },
        },
      ]

      expect(bangumiHandler.resolve('https://bgm.tv/user/sai')).toEqual(expected)
    })

    it('should return the bgm.tv feeds for a chii.in user page', () => {
      const expected = [
        {
          uri: 'https://bgm.tv/feed/user/sai/interests',
          hint: { key: 'bangumi:collections', label: 'Collections' },
        },
        {
          uri: 'https://bgm.tv/feed/user/sai/timeline',
          hint: { key: 'bangumi:timeline', label: 'Timeline' },
        },
      ]

      expect(bangumiHandler.resolve('https://chii.in/user/sai')).toEqual(expected)
    })

    it('should return the blog feed for any other page', () => {
      const expected = [
        {
          uri: 'https://bangumi.tv/feed/blog/all',
          hint: { key: 'bangumi:blog', label: 'Blog' },
        },
      ]

      expect(bangumiHandler.resolve('https://bangumi.tv/')).toEqual(expected)
    })
  })
})
