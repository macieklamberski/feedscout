import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { pinterestHandler } from './pinterest.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

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
const savedHtml = createPageHtml({ '': {} })
const expectedIcon: Array<DiscoverUriEntry> = [
  { uri: 'https://i.pinimg.com/280x280_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg' },
]

describe('pinterestHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice')).toBe(true)
      expect(pinterestHandler.match('https://pinterest.com/alice/')).toBe(true)
    })

    it('should match saved pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice/_saved/')).toBe(true)
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
      it('should return the avatar from the profile page content', async () => {
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice/',
          profileHtml,
        )

        expect(result).toEqual(expectedIcon)
      })

      it('should fetch the profile page for a saved page', async () => {
        const mockFetch = createMockFetch({ 'https://www.pinterest.com/alice/': profileHtml })
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice/_saved/',
          savedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual(expectedIcon)
      })

      it('should fetch the profile page when no content is given', async () => {
        const mockFetch = createMockFetch({ 'https://www.pinterest.com/alice/': profileHtml })
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual(expectedIcon)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for board pages', async () => {
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice/recipes/',
          profileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for the default avatar', async () => {
        const html = createPageHtml({
          '1': {
            username: 'alice',
            image_xlarge_url: 'https://s.pinimg.com/images/user/default_280.png',
          },
        })
        const result = await pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when image_xlarge_url is missing', async () => {
        const html = createPageHtml({ '1': { username: 'alice' } })
        const result = await pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when the page lists another user', async () => {
        const result = await pinterestHandler.resolve('https://www.pinterest.com/bob/', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array when the initial props are not valid JSON', async () => {
        const html = '<script id="__PWS_INITIAL_PROPS__" type="application/json">{not-json</script>'
        const result = await pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice/_saved/',
          savedHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice/_saved/',
          savedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the fetched page has no initial props', async () => {
        const mockFetch = createMockFetch({
          'https://www.pinterest.com/alice/': '<html></html>',
        })
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/alice/_saved/',
          savedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const result = await pinterestHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should match the username case-insensitively', async () => {
        const result = await pinterestHandler.resolve(
          'https://www.pinterest.com/Alice/',
          profileHtml,
        )

        expect(result).toEqual(expectedIcon)
      })
    })
  })
})
