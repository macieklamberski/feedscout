import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../common/types.js'
import { normalizeInput } from './utils.js'

describe('normalizeInput', () => {
  const createMockFetch = (body: string, headers: Record<string, string> = {}): DiscoverFetchFn => {
    return async (url: string) => ({
      url,
      body,
      headers: new Headers(headers),
      status: 200,
      statusText: 'OK',
    })
  }

  it('should fetch and normalize string input', async () => {
    const mockFetch = createMockFetch('<html></html>', { 'content-type': 'text/html' })
    const value = await normalizeInput('https://example.com/', mockFetch)
    const expected = {
      url: 'https://example.com/',
      content: '<html></html>',
      headers: expect.any(Headers),
    }

    expect(value).toEqual(expected)
  })

  it('should pass through object input unchanged', async () => {
    const mockFetch = createMockFetch('')
    const headers = new Headers({ link: '<https://hub.example.com/>; rel="hub"' })
    const value = await normalizeInput(
      {
        url: 'https://example.com/',
        content: '<html></html>',
        headers,
      },
      mockFetch,
    )
    const expected = {
      url: 'https://example.com/',
      content: '<html></html>',
      headers,
    }

    expect(value).toEqual(expected)
  })

  it('should handle object input with partial properties', async () => {
    const mockFetch = createMockFetch('')
    const value = await normalizeInput({ url: 'https://example.com/' }, mockFetch)
    const expected = {
      url: 'https://example.com/',
      content: undefined,
      headers: undefined,
    }

    expect(value).toEqual(expected)
  })

  it('should set content to undefined when response body is not a string', async () => {
    const mockFetch: DiscoverFetchFn = async (url: string) => ({
      url,
      body: new ReadableStream(),
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
    })
    const value = await normalizeInput('https://example.com/', mockFetch)

    expect(value.content).toBeUndefined()
  })
})
