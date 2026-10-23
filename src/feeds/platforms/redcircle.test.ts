import { describe, expect, it } from 'bun:test'
import { redcircleHandler } from './redcircle.js'

const showUuid = 'e8ab057c-683d-4375-a197-2dcc42d4f851'
const content = `<meta property="og:url" content="https://www.redcircle.com/shows/${showUuid}"/>`

describe('redcircleHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string, string | undefined]> = [
      [true, `https://redcircle.com/shows/${showUuid}`, undefined],
      [true, `https://www.redcircle.com/shows/${showUuid}/ep/0af0d3c2`, undefined],
      [true, 'https://redcircle.com/shows/japanese-with-shun', content],
      [false, 'https://redcircle.com/shows/japanese-with-shun', undefined],
      [false, 'https://redcircle.com/shows/japanese-with-shun', '<html></html>'],
      [
        false,
        'https://redcircle.com/shows/japanese-with-shun',
        '<meta property="og:url" content="/">',
      ],
      [false, 'https://redcircle.com/showsx/japanese-with-shun', content],
      [false, 'https://redcircle.com/', content],
      [false, `https://example.com/shows/${showUuid}`, undefined],
      [false, 'not-a-url', undefined],
    ]

    it.each(values)('should return %s for %s', (expected, url, value) => {
      expect(redcircleHandler.match(url, value)).toBe(expected)
    })
  })

  describe('resolve', () => {
    const expected = [
      {
        uri: `https://feeds.redcircle.com/${showUuid}`,
        hint: { key: 'redcircle:show', label: 'Show' },
      },
    ]

    it('should return show feed from uuid in URL', () => {
      const value = `https://redcircle.com/shows/${showUuid}`

      expect(redcircleHandler.resolve(value)).toEqual(expected)
    })

    it('should return show feed from og:url on slug episode page', () => {
      const value = 'https://redcircle.com/shows/japanese-with-shun/ep/0af0d3c2'
      const episodeContent = `<meta property="og:url" content="https://www.redcircle.com/shows/${showUuid}/ep/0af0d3c2"/>`

      expect(redcircleHandler.resolve(value, episodeContent)).toEqual(expected)
    })

    it('should return empty array for slug page without content', () => {
      const value = 'https://redcircle.com/shows/japanese-with-shun'

      expect(redcircleHandler.resolve(value)).toEqual([])
    })
  })
})
