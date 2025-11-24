import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import type { FetchFnResponse } from '../common/types.js'
import {
  createAxiosAdapter,
  createGotAdapter,
  createKyAdapter,
  createNativeFetchAdapter,
} from './adapters.js'

// biome-ignore lint/suspicious/noExplicitAny: Mock helper needs flexible signature
const createFetchMock = <T extends (...args: Array<any>) => Promise<Response>>(
  implementation: T,
) => {
  return implementation as unknown as typeof fetch
}

type MockResponse = Pick<Response, 'headers' | 'text' | 'url' | 'status' | 'statusText'>

const createMockResponse = (partial: Partial<MockResponse>): Response => {
  return {
    headers: partial.headers ?? new Headers(),
    text: partial.text ?? (async () => ''),
    url: partial.url ?? '',
    status: partial.status ?? 200,
    statusText: partial.statusText ?? 'OK',
  } as Response
}

describe('createNativeFetchAdapter', () => {
  const fetchSpy = spyOn(globalThis, 'fetch')

  afterEach(() => {
    fetchSpy.mockReset()
  })

  it('should create adapter that calls native fetch with correct URL', async () => {
    fetchSpy.mockImplementation(
      createFetchMock(async (url: string) => {
        return createMockResponse({
          url,
          text: async () => 'response body',
        })
      }),
    )
    const adapter = createNativeFetchAdapter()
    const result = await adapter('https://example.com/feed.xml')

    expect(result.url).toBe('https://example.com/feed.xml')
  })

  it('should merge base options with call options', async () => {
    let capturedOptions: RequestInit | undefined
    fetchSpy.mockImplementation(
      createFetchMock(async (_url: string, options?: RequestInit) => {
        capturedOptions = options
        return createMockResponse({})
      }),
    )
    const adapter = createNativeFetchAdapter({ credentials: 'include' })

    await adapter('https://example.com/feed.xml')

    expect(capturedOptions?.credentials).toBe('include')
  })

  it('should merge headers from base and call options', async () => {
    let capturedOptions: RequestInit | undefined
    const mockFetch = async (_url: string, options?: RequestInit) => {
      capturedOptions = options
      return createMockResponse({})
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter({
      headers: { 'X-Base': 'base-value' },
    })

    await adapter('https://example.com/feed.xml', {
      headers: { 'X-Custom': 'custom-value' },
    })

    expect(capturedOptions?.headers).toBeDefined()
    expect(capturedOptions?.headers).toHaveProperty('X-Base', 'base-value')
    expect(capturedOptions?.headers).toHaveProperty('X-Custom', 'custom-value')
  })

  it('should default to GET method when not specified', async () => {
    let capturedOptions: RequestInit | undefined
    const mockFetch = async (_url: string, options?: RequestInit) => {
      capturedOptions = options
      return createMockResponse({})
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter()

    await adapter('https://example.com/feed.xml')

    expect(capturedOptions?.method).toBe('GET')
  })

  it('should use specified method from options', async () => {
    let capturedOptions: RequestInit | undefined
    const mockFetch = async (_url: string, options?: RequestInit) => {
      capturedOptions = options
      return createMockResponse({})
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter()

    await adapter('https://example.com/feed.xml', { method: 'HEAD' })

    expect(capturedOptions?.method).toBe('HEAD')
  })

  it('should return response with correct structure', async () => {
    const mockFetch = async () => {
      return createMockResponse({
        headers: new Headers({ 'content-type': 'application/rss+xml' }),
        text: async () => 'feed content',
        url: 'https://example.com/feed.xml',
        status: 200,
        statusText: 'OK',
      })
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter()
    const expected: FetchFnResponse = {
      headers: new Headers({ 'content-type': 'application/rss+xml' }),
      body: 'feed content',
      url: 'https://example.com/feed.xml',
      status: 200,
      statusText: 'OK',
    }

    const result = await adapter('https://example.com/feed.xml')

    expect(result.headers.get('content-type')).toBe(expected.headers.get('content-type'))
    expect(result.body).toBe(expected.body)
    expect(result.url).toBe(expected.url)
    expect(result.status).toBe(expected.status)
    expect(result.statusText).toBe(expected.statusText)
  })

  it('should preserve response URL for redirect handling', async () => {
    const mockFetch = async () => {
      return createMockResponse({
        url: 'https://redirect.example.com/feed.xml',
      })
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter()
    const result = await adapter('https://example.com/feed.xml')

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should convert response body to text', async () => {
    const mockFetch = async () => {
      return createMockResponse({
        text: async () => '<rss>feed content</rss>',
      })
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter()
    const result = await adapter('https://example.com/feed.xml')

    expect(result.body).toBe('<rss>feed content</rss>')
  })

  it('should pass through status and statusText', async () => {
    const mockFetch = async () => {
      return createMockResponse({
        status: 404,
        statusText: 'Not Found',
      })
    }
    fetchSpy.mockImplementation(createFetchMock(mockFetch))
    const adapter = createNativeFetchAdapter()
    const result = await adapter('https://example.com/feed.xml')

    expect(result.status).toBe(404)
    expect(result.statusText).toBe('Not Found')
  })
})

describe('createGotAdapter', () => {
  it('should create adapter that calls got instance with correct URL', async () => {
    let capturedUrl = ''
    const mockGot = async (url: string) => {
      capturedUrl = url
      return {
        headers: {},
        body: '',
        url,
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)

    await adapter('https://example.com/feed.xml')

    expect(capturedUrl).toBe('https://example.com/feed.xml')
  })

  it('should use GET method by default', async () => {
    let capturedOptions: Record<string, unknown> = {}
    const mockGot = async (_url: string, options: Record<string, unknown>) => {
      capturedOptions = options
      return {
        headers: {},
        body: '',
        url: '',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)

    await adapter('https://example.com/feed.xml')

    expect(capturedOptions.method).toBe('GET')
  })

  it('should pass custom headers to got', async () => {
    let capturedOptions: Record<string, unknown> = {}
    const mockGot = async (_url: string, options: Record<string, unknown>) => {
      capturedOptions = options
      return {
        headers: {},
        body: '',
        url: '',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)

    await adapter('https://example.com/feed.xml', {
      headers: { 'X-Custom': 'value' },
    })

    expect(capturedOptions.headers).toBeDefined()
    expect(capturedOptions.headers).toHaveProperty('X-Custom', 'value')
  })

  it('should set throwHttpErrors to false', async () => {
    let capturedOptions: Record<string, unknown> = {}
    const mockGot = async (_url: string, options: Record<string, unknown>) => {
      capturedOptions = options
      return {
        headers: {},
        body: '',
        url: '',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)

    await adapter('https://example.com/feed.xml')

    expect(capturedOptions.throwHttpErrors).toBe(false)
  })

  it('should convert got headers to Headers object', async () => {
    const mockGot = async () => {
      return {
        headers: { 'content-type': 'application/rss+xml' },
        body: '',
        url: '',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.headers).toBeInstanceOf(Headers)
    expect(result.headers.get('content-type')).toBe('application/rss+xml')
  })

  it('should extract URL from got response', async () => {
    const mockGot = async () => {
      return {
        headers: {},
        body: '',
        url: 'https://redirect.example.com/feed.xml',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should map statusCode to status', async () => {
    const mockGot = async () => {
      return {
        headers: {},
        body: '',
        url: '',
        statusCode: 404,
        statusMessage: 'Not Found',
      }
    }
    const adapter = createGotAdapter(mockGot)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.status).toBe(404)
  })

  it('should map statusMessage to statusText', async () => {
    const mockGot = async () => {
      return {
        headers: {},
        body: '',
        url: '',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.statusText).toBe('OK')
  })

  it('should return body as-is from got response', async () => {
    const mockGot = async () => {
      return {
        headers: {},
        body: '<rss>feed content</rss>',
        url: '',
        statusCode: 200,
        statusMessage: 'OK',
      }
    }
    const adapter = createGotAdapter(mockGot)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.body).toBe('<rss>feed content</rss>')
  })
})

describe('createAxiosAdapter', () => {
  it('should create adapter that calls axios with correct config', async () => {
    let capturedConfig: Record<string, unknown> = {}
    const mockAxios = async (config: Record<string, unknown>) => {
      capturedConfig = config
      return {
        headers: {},
        data: '',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)

    await adapter('https://example.com/feed.xml')

    expect(capturedConfig.url).toBe('https://example.com/feed.xml')
  })

  it('should use GET method by default', async () => {
    let capturedConfig: Record<string, unknown> = {}
    const mockAxios = async (config: Record<string, unknown>) => {
      capturedConfig = config
      return {
        headers: {},
        data: '',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)

    await adapter('https://example.com/feed.xml')

    expect(capturedConfig.method).toBe('GET')
  })

  it('should pass custom headers to axios', async () => {
    let capturedConfig: Record<string, unknown> = {}
    const mockAxios = async (config: Record<string, unknown>) => {
      capturedConfig = config
      return {
        headers: {},
        data: '',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)

    await adapter('https://example.com/feed.xml', {
      headers: { 'X-Custom': 'value' },
    })

    expect(capturedConfig.headers).toBeDefined()
    expect(capturedConfig.headers).toHaveProperty('X-Custom', 'value')
  })

  it('should set validateStatus to always return true', async () => {
    let capturedConfig: Record<string, unknown> = {}
    const mockAxios = async (config: Record<string, unknown>) => {
      capturedConfig = config
      return {
        headers: {},
        data: '',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)

    await adapter('https://example.com/feed.xml')

    expect(capturedConfig.validateStatus).toBeDefined()
    expect(typeof capturedConfig.validateStatus).toBe('function')
    if (typeof capturedConfig.validateStatus === 'function') {
      expect(capturedConfig.validateStatus()).toBe(true)
    }
  })

  it('should convert axios headers to Headers object', async () => {
    const mockAxios = async () => {
      return {
        headers: { 'content-type': 'application/rss+xml' },
        data: '',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.headers).toBeInstanceOf(Headers)
    expect(result.headers.get('content-type')).toBe('application/rss+xml')
  })

  it('should extract URL from responseUrl when available', async () => {
    const mockAxios = async () => {
      return {
        headers: {},
        data: '',
        status: 200,
        statusText: 'OK',
        request: {
          res: {
            responseUrl: 'https://redirect.example.com/feed.xml',
          },
        },
      }
    }
    const adapter = createAxiosAdapter(mockAxios)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should fallback to request URL when responseUrl unavailable', async () => {
    const mockAxios = async () => {
      return {
        headers: {},
        data: '',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.url).toBe('https://example.com/feed.xml')
  })

  it('should return data as body', async () => {
    const mockAxios = async () => {
      return {
        headers: {},
        data: '<rss>feed content</rss>',
        status: 200,
        statusText: 'OK',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.body).toBe('<rss>feed content</rss>')
  })

  it('should pass through status and statusText', async () => {
    const mockAxios = async () => {
      return {
        headers: {},
        data: '',
        status: 404,
        statusText: 'Not Found',
        request: {},
      }
    }
    const adapter = createAxiosAdapter(mockAxios)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.status).toBe(404)
    expect(result.statusText).toBe('Not Found')
  })
})

describe('createKyAdapter', () => {
  it('should create adapter that calls ky with correct URL', async () => {
    let capturedUrl = ''
    const mockKy = async (url: string) => {
      capturedUrl = url
      return {
        headers: new Headers(),
        text: async () => '',
        url,
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)

    await adapter('https://example.com/feed.xml')

    expect(capturedUrl).toBe('https://example.com/feed.xml')
  })

  it('should use GET method by default', async () => {
    let capturedOptions: Record<string, unknown> = {}
    const mockKy = async (_url: string, options: Record<string, unknown>) => {
      capturedOptions = options
      return {
        headers: new Headers(),
        text: async () => '',
        url: '',
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)

    await adapter('https://example.com/feed.xml')

    expect(capturedOptions.method).toBe('GET')
  })

  it('should pass custom headers to ky', async () => {
    let capturedOptions: Record<string, unknown> = {}
    const mockKy = async (_url: string, options: Record<string, unknown>) => {
      capturedOptions = options
      return {
        headers: new Headers(),
        text: async () => '',
        url: '',
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)

    await adapter('https://example.com/feed.xml', {
      headers: { 'X-Custom': 'value' },
    })

    expect(capturedOptions.headers).toBeDefined()
    expect(capturedOptions.headers).toHaveProperty('X-Custom', 'value')
  })

  it('should set throwHttpErrors to false', async () => {
    let capturedOptions: Record<string, unknown> = {}
    const mockKy = async (_url: string, options: Record<string, unknown>) => {
      capturedOptions = options
      return {
        headers: new Headers(),
        text: async () => '',
        url: '',
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)

    await adapter('https://example.com/feed.xml')

    expect(capturedOptions.throwHttpErrors).toBe(false)
  })

  it('should preserve ky response headers', async () => {
    const mockKy = async () => {
      return {
        headers: new Headers({ 'content-type': 'application/rss+xml' }),
        text: async () => '',
        url: '',
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.headers.get('content-type')).toBe('application/rss+xml')
  })

  it('should convert response body to text', async () => {
    const mockKy = async () => {
      return {
        headers: new Headers(),
        text: async () => '<rss>feed content</rss>',
        url: '',
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.body).toBe('<rss>feed content</rss>')
  })

  it('should use response.url from ky', async () => {
    const mockKy = async () => {
      return {
        headers: new Headers(),
        text: async () => '',
        url: 'https://redirect.example.com/feed.xml',
        status: 200,
        statusText: 'OK',
      }
    }
    const adapter = createKyAdapter(mockKy)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.url).toBe('https://redirect.example.com/feed.xml')
  })

  it('should pass through status and statusText', async () => {
    const mockKy = async () => {
      return {
        headers: new Headers(),
        text: async () => '',
        url: '',
        status: 404,
        statusText: 'Not Found',
      }
    }
    const adapter = createKyAdapter(mockKy)
    const result = await adapter('https://example.com/feed.xml')

    expect(result.status).toBe(404)
    expect(result.statusText).toBe('Not Found')
  })
})
