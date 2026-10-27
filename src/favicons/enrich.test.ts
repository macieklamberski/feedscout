import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../common/types.js'
import { createEnrichFaviconFn } from './enrich.js'
import type { FaviconEnricher } from './types.js'

const aliceRef: DiscoverRef = {
  platform: 'example',
  id: 'alice',
  url: 'https://example.com/@alice',
}

const fetchFn: FetchFn = (url) => {
  return { url, body: '', headers: new Headers(), status: 200 }
}

const createEnricher = (platform: string, uri: string): FaviconEnricher => {
  return (ref) => {
    if (ref.platform !== platform) {
      return
    }

    return [uri]
  }
}

describe('createEnrichFaviconFn', () => {
  it('should return the URIs of the enricher that answers the ref', async () => {
    const enricher: FaviconEnricher = (ref) => [`https://cdn.example.com/${ref.id}.png`]
    const enrichFn = createEnrichFaviconFn({ enrichers: [enricher], fetchFn })

    expect(await enrichFn(aliceRef)).toEqual(['https://cdn.example.com/alice.png'])
  })

  it('should make the enricher requests through the given fetchFn', async () => {
    const requested: Array<string> = []
    const trackingFetchFn: FetchFn = (url) => {
      requested.push(url)

      return { url, body: '', headers: new Headers(), status: 200 }
    }
    const enricher: FaviconEnricher = async (ref, context) => {
      await context.fetchFn(`https://api.example.com/${ref.id}`)

      return []
    }
    const enrichFn = createEnrichFaviconFn({ enrichers: [enricher], fetchFn: trackingFetchFn })

    await enrichFn(aliceRef)

    expect(requested).toEqual(['https://api.example.com/alice'])
  })

  it('should hand the enricher a stream body read to text', async () => {
    const streamFetchFn: FetchFn = (url) => {
      const body = new Response('{"avatar":"a.png"}').body as ReadableStream<Uint8Array>

      return { url, body, headers: new Headers(), status: 200 }
    }
    let receivedBody: unknown
    const enricher: FaviconEnricher = async (ref, context) => {
      receivedBody = (await context.fetchFn(`https://api.example.com/${ref.id}`)).body

      return []
    }
    const enrichFn = createEnrichFaviconFn({ enrichers: [enricher], fetchFn: streamFetchFn })

    await enrichFn(aliceRef)

    expect(receivedBody).toBe('{"avatar":"a.png"}')
  })

  it('should try the next enricher when one returns undefined', async () => {
    const enrichers: Array<FaviconEnricher> = [
      createEnricher('other', 'https://cdn.example.com/other.png'),
      createEnricher('example', 'https://cdn.example.com/example.png'),
    ]
    const enrichFn = createEnrichFaviconFn({ enrichers, fetchFn })

    expect(await enrichFn(aliceRef)).toEqual(['https://cdn.example.com/example.png'])
  })

  it('should reject when an enricher throws', () => {
    const error = new Error('Enrich error')
    const enricher: FaviconEnricher = () => {
      throw error
    }
    const enrichFn = createEnrichFaviconFn({ enrichers: [enricher], fetchFn })
    const throwing = () => enrichFn(aliceRef)

    expect(throwing()).rejects.toBe(error)
  })

  it('should return undefined for a ref no enricher answers', async () => {
    const enrichers: Array<FaviconEnricher> = [
      createEnricher('other', 'https://cdn.example.com/other.png'),
    ]
    const enrichFn = createEnrichFaviconFn({ enrichers, fetchFn })

    expect(await enrichFn(aliceRef)).toBeUndefined()
  })
})
