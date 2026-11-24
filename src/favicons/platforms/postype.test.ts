import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { type PostypeUrl, parsePostypeUrl, postypeEnricher, postypeHandler } from './postype.js'

describe('parsePostypeUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: PostypeUrl = { kind: 'channel', channel: 'example' }

    expect(parsePostypeUrl('https://www.postype.com/@example')).toEqual(expected)
  })

  it('should return the channel for the bare host', () => {
    const expected: PostypeUrl = { kind: 'channel', channel: 'example' }

    expect(parsePostypeUrl('https://postype.com/@example')).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const expected: PostypeUrl = { kind: 'post', channel: 'example' }

    expect(parsePostypeUrl('https://www.postype.com/@example/post/23216701')).toEqual(expected)
  })

  it('should return the channel for a channel subdomain', () => {
    const expected: PostypeUrl = { kind: 'subdomain', channel: 'example' }

    expect(parsePostypeUrl('https://example.postype.com/')).toEqual(expected)
  })

  it('should return undefined for a bare at sign', () => {
    expect(parsePostypeUrl('https://www.postype.com/@')).toBeUndefined()
  })

  it('should return undefined for a page outside a channel', () => {
    expect(parsePostypeUrl('https://www.postype.com/explore')).toBeUndefined()
  })

  it('should return undefined for the main host root', () => {
    expect(parsePostypeUrl('https://www.postype.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePostypeUrl('https://a.b.postype.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePostypeUrl('https://example.com/@example')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePostypeUrl('not-a-url')).toBeUndefined()
  })
})

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
        const expected = [{ uri: avatarUrl }]

        expect(postypeHandler.resolve(value, channelPage)).toEqual(expected)
      })

      it('should return a ref to the channel when the content is missing', () => {
        const value = 'https://www.postype.com/@example'
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value)).toEqual(expected)
      })

      it('should return a ref to the channel for a channel subdomain', () => {
        const value = 'https://example.postype.com/series'
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value, channelPage)).toEqual(expected)
      })

      it('should return a ref to the channel for a post page', () => {
        const value = 'https://www.postype.com/@example/post/23216701'
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value, channelPage)).toEqual(expected)
      })

      it('should return a ref to the channel for its feed', () => {
        const value = 'https://www.postype.com/@example/rss'
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value)).toEqual(expected)
      })

      it('should return a ref to the channel for a subdomain feed', () => {
        const value = 'https://example.postype.com/rss'
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return a ref to the channel when the page carries the placeholder', () => {
        const value = 'https://www.postype.com/@example'
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value, channelPageWithoutAvatar)).toEqual(expected)
      })

      it('should return a ref to the channel when the og:image url has no http origin', () => {
        const value = 'https://www.postype.com/@example'
        const content = `
          <meta
            property="og:image"
            content="cdn://d3mcojo3jv0dbr.cloudfront.net/2026/02/16/10/42/1a2ffc17168638878779956409.jpg"
          />
        `
        const expected = [createRef(value)]

        expect(postypeHandler.resolve(value, content)).toEqual(expected)
      })

      it('should return a ref to the channel when the page has no og:image', () => {
        const value = 'https://www.postype.com/@example'
        const expected = [createRef(value)]

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
