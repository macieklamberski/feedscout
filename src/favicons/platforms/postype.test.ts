import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { postypeEnricher, postypeHandler } from './postype.js'

const avatarUrl =
  'https://d3mcojo3jv0dbr.cloudfront.net/2026/02/16/10/42/1a2ffc17168638878779956409.jpg?w=200&h=200'

const channelPage = `
  <meta
    property="og:image"
    content="https://d3mcojo3jv0dbr.cloudfront.net/2026/02/16/10/42/1a2ffc17168638878779956409.jpg?w=1000&amp;h=500&amp;q=65"
  />
`

const channelPageWithoutAvatar = `
  <meta
    property="og:image"
    content="https://d33pksfia2a94m.cloudfront.net/assets/img/empty/empty_thumbnail_seo.png?w=1000&amp;h=500&amp;q=65"
  />
`

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string): DiscoverRef => {
  return { platform: 'postype', id: 'example', url }
}

describe('postypeHandler', () => {
  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the square avatar from the channel page content', () => {
        const value = 'https://www.postype.com/@example'
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(postypeHandler.resolve(value, channelPage)).toEqual(expected)
      })

      it('should return a ref to the channel when the content is missing', () => {
        const value = 'https://www.postype.com/@example'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(postypeHandler.resolve(value)).toEqual(expected)
      })

      it('should return a ref to the channel for a channel subdomain', () => {
        const value = 'https://example.postype.com/series'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(postypeHandler.resolve(value, channelPage)).toEqual(expected)
      })

      it('should return a ref to the channel for a post page', () => {
        const value = 'https://www.postype.com/@example/post/23216701'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(postypeHandler.resolve(value, channelPage)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return a ref to the channel when the page carries the placeholder', () => {
        const value = 'https://www.postype.com/@example'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(postypeHandler.resolve(value, channelPageWithoutAvatar)).toEqual(expected)
      })

      it('should return a ref to the channel when the page has no og:image', () => {
        const value = 'https://www.postype.com/@example'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(postypeHandler.resolve(value, '<title>Example</title>')).toEqual(expected)
      })

      it('should return empty array for a page outside a channel', () => {
        expect(postypeHandler.resolve('https://www.postype.com/explore', channelPage)).toEqual([])
      })
    })
  })
})

describe('postypeEnricher', () => {
  it('should return the square avatar from the channel page', async () => {
    const context = createContext({ 'https://www.postype.com/@example': channelPage })
    const ref = createRef('https://www.postype.com/@example/post/23216701')

    expect(await postypeEnricher(ref, context)).toEqual([avatarUrl])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'example',
      url: 'https://example.com/@example',
    }

    expect(await postypeEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the channel page carries the placeholder', async () => {
    const context = createContext({ 'https://www.postype.com/@example': channelPageWithoutAvatar })
    const ref = createRef('https://www.postype.com/@example')

    expect(await postypeEnricher(ref, context)).toEqual([])
  })

  it('should reject when the body is a stream', () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })
    const ref = createRef('https://www.postype.com/@example')
    const throwing = () => postypeEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Unexpected stream body')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://www.postype.com/@example')
    const throwing = () => postypeEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', () => {
    const ref = createRef('https://www.postype.com/@example')
    const throwing = () => postypeEnricher(ref, createContext({}))
    const expected = 'Unexpected status 404 from https://www.postype.com/@example'

    expect(throwing()).rejects.toThrow(expected)
  })
})
