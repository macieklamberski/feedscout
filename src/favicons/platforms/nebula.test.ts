import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { nebulaEnricher, nebulaHandler } from './nebula.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const apiUrl = 'https://content.api.nebula.app/content/realengineering/'

const ref: DiscoverRef = {
  platform: 'nebula',
  id: 'realengineering',
  url: 'https://nebula.tv/realengineering',
}

const createPage = (queryData: string): string => {
  return `<html><head><script type='text/javascript'>window.__QUERY_DATA__=${queryData};</script></head></html>`
}

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

    it('should not match the home page', () => {
      expect(nebulaHandler.match('https://nebula.tv/')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the 512 channel avatar from the page query data', () => {
        const value = createPage(channelQueryData)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.nebula.tv/e816edc6.jpeg?width=512' },
        ]

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual(expected)
      })

      it('should return a ref with the channel slug without page content', () => {
        const url = 'https://nebula.tv/realengineering'
        const expected: Array<DiscoverRef> = [{ platform: 'nebula', id: 'realengineering', url }]

        expect(nebulaHandler.resolve(url)).toEqual(expected)
      })

      it('should return a ref with the channel slug when the page has no query data', () => {
        const url = 'https://nebula.tv/realengineering'
        const value = '<html><head><title>Nebula</title></head></html>'
        const expected: Array<DiscoverRef> = [{ platform: 'nebula', id: 'realengineering', url }]

        expect(nebulaHandler.resolve(url, value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return a ref when the page query data is not valid JSON', () => {
        const value = createPage('{"queries":[}')

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([ref])
      })

      it('should return a ref when no content query is present', () => {
        const queryData = JSON.stringify({
          queries: [{ queryKey: ['featured_pages'], state: { data: [] } }],
        })
        const value = createPage(queryData)

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([ref])
      })

      it('should return a ref when the 512 avatar is missing', () => {
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

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([ref])
      })

      it('should return empty array for the home page', () => {
        const value = createPage(channelQueryData)

        expect(nebulaHandler.resolve('https://nebula.tv/', value)).toEqual([])
      })
    })
  })
})

describe('nebulaEnricher', () => {
  it('should return the 512 channel avatar from the content API', async () => {
    const context = createContext({ [apiUrl]: JSON.stringify(channel) })
    const expected = ['https://images.nebula.tv/e816edc6.jpeg?width=512']

    expect(await nebulaEnricher(ref, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'user',
      url: 'https://example.com/@user',
    }

    expect(await nebulaEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the content API has no avatar', async () => {
    const context = createContext({ [apiUrl]: JSON.stringify({ app_path: 'realengineering' }) })

    expect(await nebulaEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the 512 avatar is missing', async () => {
    const body = JSON.stringify({
      assets: {
        avatar: {
          '256': { original: 'https://images.nebula.tv/e816edc6.jpeg?width=256' },
        },
      },
    })
    const context = createContext({ [apiUrl]: body })

    expect(await nebulaEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the 512 original is empty', async () => {
    const body = JSON.stringify({ assets: { avatar: { '512': { original: '' } } } })
    const context = createContext({ [apiUrl]: body })

    expect(await nebulaEnricher(ref, context)).toEqual([])
  })

  it('should reject when the content API returns invalid JSON', () => {
    const context = createContext({ [apiUrl]: 'not-json' })
    const throwing = () => nebulaEnricher(ref, context)

    expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => nebulaEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', () => {
    const throwing = () => nebulaEnricher(ref, createContext({}))
    const expected =
      'Unexpected status 404 from https://content.api.nebula.app/content/realengineering/'

    expect(throwing()).rejects.toThrow(expected)
  })
})
