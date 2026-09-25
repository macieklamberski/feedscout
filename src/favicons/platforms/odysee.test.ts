import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn, FetchFnOptions } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { odyseeEnricher, odyseeHandler } from './odysee.js'

type Request = {
  url: string
  options?: FetchFnOptions
}

const apiUrl = 'https://api.na-backend.odysee.com/api/v1/proxy?m=resolve'

const createContext = (body: string, requests: Array<Request> = []): FaviconEnricherContext => {
  const fetchFn: FetchFn = (url, options) => {
    requests.push({ url, options })

    return { headers: new Headers(), body, url, status: 200 }
  }

  return { fetchFn }
}

const createResponse = (thumbnail: unknown): string => {
  return JSON.stringify({ result: { 'lbry://@alice:3f': { value: { thumbnail } } } })
}

const ref: DiscoverRef = {
  platform: 'odysee',
  id: 'alice:3f',
  url: 'https://odysee.com/@alice:3f',
}

describe('odyseeHandler', () => {
  describe('match', () => {
    it('should match channel URLs', () => {
      expect(odyseeHandler.match('https://odysee.com/@alice')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(odyseeHandler.match('https://odysee.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a channel URL', async () => {
      const url = 'https://odysee.com/@alice'
      const expected: Array<DiscoverRef> = [{ platform: 'odysee', id: 'alice', url }]

      expect(await odyseeHandler.resolve(url)).toEqual(expected)
    })

    it('should return a ref with the claim id prefix', async () => {
      const url = 'https://odysee.com/@alice:3f'
      const expected: Array<DiscoverRef> = [{ platform: 'odysee', id: 'alice:3f', url }]

      expect(await odyseeHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for the home page', async () => {
      expect(await odyseeHandler.resolve('https://odysee.com/')).toEqual([])
    })
  })
})

describe('odyseeEnricher', () => {
  it('should return the channel thumbnail from the resolve API', async () => {
    const requests: Array<Request> = []
    const context = createContext(
      createResponse({ url: 'https://thumbs.odycdn.com/0f3c.webp' }),
      requests,
    )
    const expected: Array<Request> = [
      {
        url: apiUrl,
        options: {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"method":"resolve","params":{"urls":["lbry://@alice:3f"]}}',
        },
      },
    ]

    expect(await odyseeEnricher(ref, context)).toEqual(['https://thumbs.odycdn.com/0f3c.webp'])
    expect(requests).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await odyseeEnricher(otherRef, createContext(''))).toBeUndefined()
  })

  it('should return empty array when thumbnail is missing', async () => {
    const context = createContext(JSON.stringify({ result: { 'lbry://@alice:3f': { value: {} } } }))

    expect(await odyseeEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when channel is not in the result', async () => {
    const context = createContext(JSON.stringify({ result: {} }))

    expect(await odyseeEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when thumbnail URL is not a string', async () => {
    const context = createContext(createResponse({ url: 123 }))

    expect(await odyseeEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when thumbnail URL is empty', async () => {
    const context = createContext(createResponse({ url: '' }))

    expect(await odyseeEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when thumbnail URL is not http', async () => {
    const context = createContext(createResponse({ url: 'lbry://@alice:3f/avatar' }))

    expect(await odyseeEnricher(ref, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', async () => {
    await expect(odyseeEnricher(ref, createContext('not json'))).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(odyseeEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the API answers a non-2xx status', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: '',
      url,
      status: 503,
    })

    await expect(odyseeEnricher(ref, { fetchFn })).rejects.toThrow()
  })
})
