import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { nebulaHandler } from './nebula.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const createPage = (queryData: string): string => {
  return `<html><head><script type='text/javascript'>window.__QUERY_DATA__=${queryData};</script></head></html>`
}

const apiUrl = 'https://content.api.nebula.app/content/realengineering/'

const channel = {
  app_path: 'realengineering',
  assets: {
    avatar: {
      '256': {
        original: 'https://images.nebula.tv/e816edc6.jpeg?width=256',
        webp: 'https://images.nebula.tv/e816edc6.webp?width=256',
      },
      '512': {
        original: 'https://images.nebula.tv/e816edc6.jpeg?width=512',
        webp: 'https://images.nebula.tv/e816edc6.webp?width=512',
      },
    },
  },
}

const channelQueryData = JSON.stringify({
  mutations: [],
  queries: [
    {
      queryKey: ['featured_pages'],
      state: { data: [{ app_path: 'featured', slug: 'featured', title: 'Featured' }] },
    },
    {
      queryKey: ['content', { slugOrId: 'realengineering' }],
      state: { data: channel },
    },
  ],
})

describe('nebulaHandler', () => {
  describe('match', () => {
    it('should match channel URLs', () => {
      expect(nebulaHandler.match('https://nebula.tv/realengineering')).toBe(true)
    })

    it('should match www.nebula.tv channel URLs', () => {
      expect(nebulaHandler.match('https://www.nebula.tv/realengineering')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(nebulaHandler.match('https://nebula.tv/')).toBe(false)
    })

    it('should not match videos pages', () => {
      expect(nebulaHandler.match('https://nebula.tv/videos')).toBe(false)
      expect(nebulaHandler.match('https://nebula.tv/videos/realengineering-why-ships-float')).toBe(
        false,
      )
    })

    it('should not match explore pages', () => {
      expect(nebulaHandler.match('https://nebula.tv/explore')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(nebulaHandler.match('https://nebula.tv/login')).toBe(false)
      expect(nebulaHandler.match('https://nebula.tv/settings')).toBe(false)
    })

    it('should not match non-Nebula URLs', () => {
      expect(nebulaHandler.match('https://example.com/realengineering')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(nebulaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the 512 channel avatar from the page query data', async () => {
        const value = createPage(channelQueryData)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.nebula.tv/e816edc6.jpeg?width=512' },
        ]

        expect(await nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual(
          expected,
        )
      })

      it('should return the 512 channel avatar from the content API without page content', async () => {
        const mockFetch = createMockFetch({ [apiUrl]: JSON.stringify(channel) })
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.nebula.tv/e816edc6.jpeg?width=512' },
        ]
        const result = await nebulaHandler.resolve(
          'https://nebula.tv/realengineering',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual(expected)
      })

      it('should fall back to the content API when the page has no query data', async () => {
        const value = '<html><head><title>Nebula</title></head></html>'
        const mockFetch = createMockFetch({ [apiUrl]: JSON.stringify(channel) })
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.nebula.tv/e816edc6.jpeg?width=512' },
        ]
        const result = await nebulaHandler.resolve(
          'https://nebula.tv/realengineering',
          value,
          undefined,
          mockFetch,
        )

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the home page', async () => {
        const value = createPage(channelQueryData)

        expect(await nebulaHandler.resolve('https://nebula.tv/', value)).toEqual([])
      })

      it('should return empty array for videos pages', async () => {
        const value = createPage(channelQueryData)

        expect(await nebulaHandler.resolve('https://nebula.tv/videos', value)).toEqual([])
      })

      it('should return empty array for explore pages', async () => {
        const value = createPage(channelQueryData)

        expect(await nebulaHandler.resolve('https://nebula.tv/explore', value)).toEqual([])
      })

      it('should return empty array without page content and fetchFn', async () => {
        expect(await nebulaHandler.resolve('https://nebula.tv/realengineering')).toEqual([])
      })

      it('should return empty array when the page query data is not valid JSON', async () => {
        const value = createPage('{"queries":[')

        expect(await nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })

      it('should return empty array when no content query is present', async () => {
        const queryData = JSON.stringify({
          queries: [{ queryKey: ['featured_pages'], state: { data: [] } }],
        })
        const value = createPage(queryData)

        expect(await nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })

      it('should return empty array when the 512 avatar is missing', async () => {
        const queryData = JSON.stringify({
          queries: [
            {
              queryKey: ['content', { slugOrId: 'realengineering' }],
              state: {
                data: {
                  assets: {
                    avatar: {
                      '256': { original: 'https://images.nebula.tv/e816edc6.jpeg?width=256' },
                    },
                  },
                },
              },
            },
          ],
        })
        const value = createPage(queryData)

        expect(await nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })

      it('should return empty array when the content API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({ [apiUrl]: 'not-json' })
        const result = await nebulaHandler.resolve(
          'https://nebula.tv/realengineering',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the content API has no avatar', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({ app_path: 'realengineering' }),
        })
        const result = await nebulaHandler.resolve(
          'https://nebula.tv/realengineering',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await nebulaHandler.resolve(
          'https://nebula.tv/realengineering',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })
  })
})
