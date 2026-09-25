import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
  describe('resolve', () => {
    it('should return avatar from profile page', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://i1.sndcdn.com/avatars-000012345678-abcdef-t500x500.jpg' },
      ]

      expect(soundcloudHandler.resolve('https://soundcloud.com/alice', profileHtml)).toEqual(
        expected,
      )
    })

    it('should return avatar when content comes before property', () => {
      const value = `
        <meta
          content="https://i1.sndcdn.com/avatars-000012345678-abcdef-t500x500.jpg"
          property="og:image"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://i1.sndcdn.com/avatars-000012345678-abcdef-t500x500.jpg' },
      ]

      expect(soundcloudHandler.resolve('https://soundcloud.com/alice', value)).toEqual(expected)
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
