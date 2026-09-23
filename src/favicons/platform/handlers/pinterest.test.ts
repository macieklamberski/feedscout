import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { pinterestHandler } from './pinterest.js'

const createPageHtml = (users: Record<string, unknown>): string => {
  const props = JSON.stringify({ initialReduxState: { users } })

  return `<html><head><script id="__PWS_INITIAL_PROPS__" type="application/json">${props}</script></head></html>`
}

const profileHtml = createPageHtml({
  '': {},
  '142567281862381039': {
    username: 'alice',
    image_medium_url: 'https://i.pinimg.com/75x75_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg',
    image_xlarge_url:
      'https://i.pinimg.com/280x280_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg',
  },
})
const expectedIcon: Array<DiscoverUriEntry> = [
  { uri: 'https://i.pinimg.com/280x280_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg' },
]

describe('pinterestHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice')).toBe(true)
      expect(pinterestHandler.match('https://pinterest.com/alice/')).toBe(true)
    })

    it('should not match saved pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice/_saved/')).toBe(false)
    })

    it('should not match board pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice/recipes/')).toBe(false)
    })

    it('should not match pin pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/pin/123456789/')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/search')).toBe(false)
      expect(pinterestHandler.match('https://www.pinterest.com/ideas')).toBe(false)
    })

    it('should not match pin.it short links', () => {
      expect(pinterestHandler.match('https://pin.it/abc123')).toBe(false)
    })

    it('should not match the root URL', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/')).toBe(false)
    })

    it('should not match non-Pinterest URLs', () => {
      expect(pinterestHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(pinterestHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the avatar from the profile page content', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', profileHtml)

        expect(result).toEqual(expectedIcon)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for board pages', () => {
        const result = pinterestHandler.resolve(
          'https://www.pinterest.com/alice/recipes/',
          profileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for the default avatar', () => {
        const html = createPageHtml({
          '1': {
            username: 'alice',
            image_xlarge_url: 'https://s.pinimg.com/images/user/default_280.png',
          },
        })
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when image_xlarge_url is missing', () => {
        const html = createPageHtml({ '1': { username: 'alice' } })
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when the page lists another user', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/bob/', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array when the initial props are not valid JSON', () => {
        const html = '<script id="__PWS_INITIAL_PROPS__" type="application/json">{not-json</script>'
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when content is missing', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/')

        expect(result).toEqual([])
      })

      it('should return empty array when the page has no initial props', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', '<html></html>')

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        const result = pinterestHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should match the username case-insensitively', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/Alice/', profileHtml)

        expect(result).toEqual(expectedIcon)
      })
    })
  })
})
