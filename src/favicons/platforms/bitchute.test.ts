import { describe, expect, it } from 'bun:test'
import { bitchuteHandler } from './bitchute.js'

const channelHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://static-3.bitchute.com/live/channel_images/aBcDeFgH1234/xYz987_large.jpg"
      >
    </head>
  </html>
`

describe('bitchuteHandler', () => {
  describe('match', () => {
    it('should match channel URLs', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/channel/example/')).toBe(true)
    })

    it('should not match video pages', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/video/aBcDeFgH1234/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return medium channel image from og:image', async () => {
      const result = await bitchuteHandler.resolve(
        'https://www.bitchute.com/channel/example/',
        channelHtml,
      )
      const expected = [
        {
          uri: 'https://static-3.bitchute.com/live/channel_images/aBcDeFgH1234/xYz987_medium.jpg',
        },
      ]

      expect(result).toEqual(expected)
    })

    it('should return empty array for generic sharing image', async () => {
      const value =
        '<meta property="og:image" content="https://bcfiles.bitchute.com/img/share/bc-sharing.webp">'
      const result = await bitchuteHandler.resolve(
        'https://www.bitchute.com/channel/unknown/',
        value,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when og:image is missing', async () => {
      const result = await bitchuteHandler.resolve(
        'https://www.bitchute.com/channel/example/',
        '<html><head></head></html>',
      )

      expect(result).toEqual([])
    })

    it('should return empty array when content is not provided', async () => {
      const result = await bitchuteHandler.resolve('https://www.bitchute.com/channel/example/')

      expect(result).toEqual([])
    })
  })
})
