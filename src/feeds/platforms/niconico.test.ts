import { describe, expect, it } from 'bun:test'
import { niconicoHandler } from './niconico.js'

describe('niconicoHandler', () => {
  describe('match', () => {
    const reservedValues: Array<string> = [
      'https://ch.nicovideo.jp/portal/anime',
      'https://ch.nicovideo.jp/search/music',
      'https://ch.nicovideo.jp/article/ar1234567',
      'https://ch.nicovideo.jp/my/following',
      'https://ch.nicovideo.jp/static/rule.html',
    ]

    it('should match a channel page', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/examplechannel')).toBe(true)
    })

    it('should match a channel section page', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/examplechannel/blomaga')).toBe(true)
    })

    it('should match a channel whose slug is a section word', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/live')).toBe(true)
    })

    it.each(reservedValues)('should not match %s', (value) => {
      expect(niconicoHandler.match(value)).toBe(false)
    })

    it('should not match a capitalized reserved path', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/Portal')).toBe(false)
    })

    it('should not match a file at the root', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/favicon.ico')).toBe(false)
    })

    it('should not match the home page', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/')).toBe(false)
    })

    it('should not match another nicovideo host', () => {
      expect(niconicoHandler.match('https://www.nicovideo.jp/user/12345')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the video, live and blog feeds for a channel page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the channel case', () => {
      const value = 'https://ch.nicovideo.jp/ExampleChannel/video'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/ExampleChannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/ExampleChannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
        {
          uri: 'https://ch.nicovideo.jp/ExampleChannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the live feed first for a live page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/live'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed first for a blog article page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/Blomaga/ar1234567'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })
  })
})
