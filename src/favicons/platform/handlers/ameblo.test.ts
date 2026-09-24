import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { amebloHandler } from './ameblo.js'

const createPage = (initData: string): string => {
  return `<html><head><script>window.INIT_DATA=${initData};window.RESOURCE_BASE_URL="https://example.com/";</script></head></html>`
}

const alicePage = createPage(
  '{"bloggerState":{"bloggerMap":{"alice":{"profile":{"ameba_id":"alice","nickname":"Alice","image_filepath":"https:\\u002F\\u002Fstat.profile.ameba.jp\\u002Fprofile_images\\u002F20191219\\u002F16\\u002F6e\\u002FNh\\u002Fj\\u002Fo44805236p_1576738801201_mk6hy.jpg","image_height":5236,"image_width":4480}}}}}',
)

describe('amebloHandler', () => {
  describe('match', () => {
    it('should match blog home URLs', () => {
      expect(amebloHandler.match('https://ameblo.jp/alice/')).toBe(true)
    })

    it('should match blog entry URLs', () => {
      expect(amebloHandler.match('https://ameblo.jp/alice/entry-12345678901.html')).toBe(true)
    })

    it('should match www.ameblo.jp URLs', () => {
      expect(amebloHandler.match('https://www.ameblo.jp/alice/')).toBe(true)
    })

    it('should not match excluded paths', () => {
      expect(amebloHandler.match('https://ameblo.jp/genre/')).toBe(false)
      expect(amebloHandler.match('https://ameblo.jp/hashtag/')).toBe(false)
      expect(amebloHandler.match('https://ameblo.jp/search')).toBe(false)
    })

    it('should not match ameblo.jp root URL', () => {
      expect(amebloHandler.match('https://ameblo.jp/')).toBe(false)
    })

    it('should not match non-Ameblo URLs', () => {
      expect(amebloHandler.match('https://example.com/alice/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(amebloHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return square crop of profile image from blog home page', async () => {
      const result = await amebloHandler.resolve('https://ameblo.jp/alice/', alicePage)
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://stat.profile.ameba.jp/profile_images/20191219/16/6e/Nh/j/o44805236p_1576738801201_mk6hy.jpg?cpd=200',
        },
      ]

      expect(result).toEqual(expected)
    })

    it('should return square crop of profile image from blog entry page', async () => {
      const result = await amebloHandler.resolve(
        'https://ameblo.jp/alice/entry-12345678901.html',
        alicePage,
      )
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://stat.profile.ameba.jp/profile_images/20191219/16/6e/Nh/j/o44805236p_1576738801201_mk6hy.jpg?cpd=200',
        },
      ]

      expect(result).toEqual(expected)
    })

    it('should return empty array when blogger is missing from bloggerMap', async () => {
      const result = await amebloHandler.resolve('https://ameblo.jp/bob/', alicePage)

      expect(result).toEqual([])
    })

    it('should return empty array when image_filepath is absent', async () => {
      const value = createPage(
        '{"bloggerState":{"bloggerMap":{"alice":{"profile":{"ameba_id":"alice"}}}}}',
      )
      const result = await amebloHandler.resolve('https://ameblo.jp/alice/', value)

      expect(result).toEqual([])
    })

    it('should return empty array when image_filepath is empty string', async () => {
      const value = createPage(
        '{"bloggerState":{"bloggerMap":{"alice":{"profile":{"image_filepath":""}}}}}',
      )
      const result = await amebloHandler.resolve('https://ameblo.jp/alice/', value)

      expect(result).toEqual([])
    })

    it('should return empty array when INIT_DATA is invalid JSON', async () => {
      const value = createPage('{"bloggerState":')
      const result = await amebloHandler.resolve('https://ameblo.jp/alice/', value)

      expect(result).toEqual([])
    })

    it('should return empty array when page has no INIT_DATA', async () => {
      const value = '<html><head><title>Alice</title></head></html>'
      const result = await amebloHandler.resolve('https://ameblo.jp/alice/', value)

      expect(result).toEqual([])
    })

    it('should return empty array when content is not provided', async () => {
      const result = await amebloHandler.resolve('https://ameblo.jp/alice/')

      expect(result).toEqual([])
    })

    it('should return empty array for root URL', async () => {
      const result = await amebloHandler.resolve('https://ameblo.jp/', alicePage)

      expect(result).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const result = await amebloHandler.resolve('not-a-url', alicePage)

      expect(result).toEqual([])
    })
  })
})
