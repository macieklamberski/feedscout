import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  describe('getFeedHint', () => {
    it('should return the show key for a show feed', () => {
      const value = `https://feeds.redcircle.com/${showUuid}`
      const expected: DiscoverUriHint = { key: 'redcircle:show', label: 'Show' }

      expect(redcircleHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show key for a show feed with a trailing slash', () => {
      const value = `https://feeds.redcircle.com/${showUuid}/`
      const expected: DiscoverUriHint = { key: 'redcircle:show', label: 'Show' }

      expect(redcircleHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show key for a show feed with a tracking query', () => {
      const value = `https://feeds.redcircle.com/${showUuid}?_gl=1*696p1f*_gcl_au*OTYzNTI1NzMxLjE2OTE4MTk5MDQ.`
      const expected: DiscoverUriHint = { key: 'redcircle:show', label: 'Show' }

      expect(redcircleHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the feed host root', () => {
      const value = 'https://feeds.redcircle.com/'

      expect(redcircleHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show page', () => {
      const value = `https://redcircle.com/shows/${showUuid}`

      expect(redcircleHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = `https://example.com/${showUuid}`

      expect(redcircleHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<string> = [
      `https://feeds.redcircle.com/${showUuid}`,
      `https://feeds.redcircle.com/${showUuid}/`,
      `https://feeds.redcircle.com/${showUuid}?_gl=1*696p1f*_gcl_au*OTYzNTI1NzMxLjE2OTE4MTk5MDQ.`,
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [redcircleHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'redcircle:show', label: 'Show' },
        },
      ]

      expect(result).toEqual(expected)
    })
  })
})
