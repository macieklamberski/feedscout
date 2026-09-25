import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { youtubeHandler } from './youtube.js'

const channelHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://yt3.googleusercontent.com/abc123=s900-c-k-c0x00ffffff-no-rj"
      >
    </head>
  </html>
`
const watchHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://i.ytimg.com/vi/abc123/maxresdefault.jpg"
      >
    </head>
    <body>
      <script>
        var ytInitialData = {"videoOwnerRenderer":{"thumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/def456=s48-c-k-c0x00ffffff-no-rj","width":48,"height":48}]}}};
      </script>
    </body>
  </html>
`

describe('youtubeHandler', () => {
  describe('match', () => {
    it('should match a handle page', () => {
      expect(youtubeHandler.match('https://www.youtube.com/@creator')).toBe(true)
    })

    it('should not match a shorts page', () => {
      expect(youtubeHandler.match('https://www.youtube.com/shorts/abc123')).toBe(false)
    })

    it('should not match a playlist page', () => {
      expect(youtubeHandler.match('https://www.youtube.com/playlist?list=PLabc123')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return og:image avatar for a handle page', async () => {
      const value = 'https://www.youtube.com/@creator'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://yt3.googleusercontent.com/abc123=s900-c-k-c0x00ffffff-no-rj' },
      ]

      expect(await youtubeHandler.resolve(value, channelHtml)).toEqual(expected)
    })

    it('should return og:image avatar for a channel ID page', async () => {
      const value = 'https://www.youtube.com/channel/UCabc123'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://yt3.googleusercontent.com/abc123=s900-c-k-c0x00ffffff-no-rj' },
      ]

      expect(await youtubeHandler.resolve(value, channelHtml)).toEqual(expected)
    })

    it('should return owner thumbnail at s900 for a watch page', async () => {
      const value = 'https://www.youtube.com/watch?v=abc123'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://yt3.ggpht.com/def456=s900-c-k-c0x00ffffff-no-rj' },
      ]

      expect(await youtubeHandler.resolve(value, watchHtml)).toEqual(expected)
    })

    it('should return owner thumbnail at s900 for a watch page with trailing slash', async () => {
      const value = 'https://www.youtube.com/watch/?v=abc123'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://yt3.ggpht.com/def456=s900-c-k-c0x00ffffff-no-rj' },
      ]

      expect(await youtubeHandler.resolve(value, watchHtml)).toEqual(expected)
    })

    it('should return owner thumbnail at s900 for a youtu.be short link', async () => {
      const value = 'https://youtu.be/abc123'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://yt3.ggpht.com/def456=s900-c-k-c0x00ffffff-no-rj' },
      ]

      expect(await youtubeHandler.resolve(value, watchHtml)).toEqual(expected)
    })

    it('should return owner thumbnail at s900 for a live page', async () => {
      const value = 'https://www.youtube.com/live/abc123'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://yt3.ggpht.com/def456=s900-c-k-c0x00ffffff-no-rj' },
      ]

      expect(await youtubeHandler.resolve(value, watchHtml)).toEqual(expected)
    })

    it('should return empty array for a watch page without owner thumbnail', async () => {
      const value = 'https://www.youtube.com/watch?v=abc123'

      expect(await youtubeHandler.resolve(value, channelHtml)).toEqual([])
    })

    it('should return empty array for a channel page without og:image', async () => {
      const value = 'https://www.youtube.com/@creator'

      expect(await youtubeHandler.resolve(value, '<html></html>')).toEqual([])
    })

    it('should return empty array when content is missing', async () => {
      expect(await youtubeHandler.resolve('https://www.youtube.com/@creator')).toEqual([])
    })

    it('should return empty array for a playlist page', async () => {
      const value = 'https://www.youtube.com/playlist?list=PLabc123'

      expect(await youtubeHandler.resolve(value, channelHtml)).toEqual([])
    })
  })
})
