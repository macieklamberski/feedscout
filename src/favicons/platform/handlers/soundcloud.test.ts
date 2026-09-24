import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { soundcloudHandler } from './soundcloud.js'

const profileHtml = `
  <head>
    <meta property="og:type" content="music.musician">
    <meta
      property="og:image"
      content="https://i1.sndcdn.com/avatars-000012345678-abcdef-t500x500.jpg"
    >
    <meta property="og:image:width" content="500">
    <meta property="og:image:height" content="500">
  </head>
`

describe('soundcloudHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/alice')).toBe(true)
    })

    it('should match profile URLs with trailing slash', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/alice/')).toBe(true)
    })

    it('should match tracks URLs', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/alice/tracks')).toBe(true)
    })

    it('should match www and mobile hosts', () => {
      expect(soundcloudHandler.match('https://www.soundcloud.com/alice')).toBe(true)
      expect(soundcloudHandler.match('https://m.soundcloud.com/alice')).toBe(true)
    })

    it('should not match track URLs', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/alice/first-song')).toBe(false)
    })

    it('should not match nested URLs', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/alice/sets/summer')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/discover')).toBe(false)
      expect(soundcloudHandler.match('https://soundcloud.com/search')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/')).toBe(false)
    })

    it('should not match non-SoundCloud URLs', () => {
      expect(soundcloudHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(soundcloudHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return avatar from profile page', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://i1.sndcdn.com/avatars-000012345678-abcdef-t500x500.jpg' },
      ]

      expect(soundcloudHandler.resolve('https://soundcloud.com/alice', profileHtml)).toEqual(
        expected,
      )
    })

    it('should return avatar from tracks page', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://i1.sndcdn.com/avatars-000012345678-abcdef-t500x500.jpg' },
      ]

      expect(soundcloudHandler.resolve('https://soundcloud.com/alice/tracks', profileHtml)).toEqual(
        expected,
      )
    })

    it('should return empty array when og:image is missing', () => {
      const value = '<head><meta property="og:type" content="music.musician"></head>'

      expect(soundcloudHandler.resolve('https://soundcloud.com/alice', value)).toEqual([])
    })

    it('should return empty array when og:image is not an avatar', () => {
      const value = `
        <meta
          property="og:image"
          content="https://i1.sndcdn.com/artworks-000098765432-ghijkl-t500x500.jpg"
        >
      `

      expect(soundcloudHandler.resolve('https://soundcloud.com/alice', value)).toEqual([])
    })

    it('should return empty array when content is missing', () => {
      expect(soundcloudHandler.resolve('https://soundcloud.com/alice')).toEqual([])
    })
  })
})
