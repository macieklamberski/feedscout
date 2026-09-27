import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../common/types.js'
import { createEnrichFeedFn } from './enrich.js'
import type { FeedEnricher } from './types.js'

const aliceRef: DiscoverRef = {
  platform: 'example',
  id: 'alice',
  url: 'https://alice.example.com/',
}

const fetchFn: FetchFn = (url) => {
  return { url, body: '', headers: new Headers(), status: 200 }
}

const createEnricher = (platform: string, uri: string): FeedEnricher => {
  return (ref) => {
    if (ref.platform !== platform) {
      return
    }

    return [uri]
  }
}

describe('createEnrichFeedFn', () => {
  it('should return the URIs of the enricher that answers the ref', async () => {
    const enricher: FeedEnricher = (ref) => [`https://feeds.example.com/${ref.id}`]
    const enrichFn = createEnrichFeedFn({ enrichers: [enricher], fetchFn })

    expect(await enrichFn(aliceRef)).toEqual(['https://feeds.example.com/alice'])
  })

  it('should answer a Simplecast ref with the default enrichers', async () => {
    const responses: Record<string, string> = {
      'https://api.simplecast.com/sites/search': '{"podcast":{"id":"abc"}}',
      'https://api.simplecast.com/podcasts/abc': '{"feed_url":"https://feeds.simplecast.com/Ab1"}',
    }
    const simplecastFetchFn: FetchFn = (url) => {
      return { url, body: responses[url] ?? '', headers: new Headers(), status: 200 }
    }
    const ref: DiscoverRef = {
      platform: 'simplecast',
      id: 'alice',
      url: 'https://alice.simplecast.com/',
    }
    const enrichFn = createEnrichFeedFn({ fetchFn: simplecastFetchFn })

    expect(await enrichFn(ref)).toEqual(['https://feeds.simplecast.com/Ab1'])
  })

  it('should hand the enricher a stream body read to text', async () => {
    const streamFetchFn: FetchFn = (url) => {
      const body = new Response('{"feed_url":"a.xml"}').body as ReadableStream<Uint8Array>

      return { url, body, headers: new Headers(), status: 200 }
    }
    let receivedBody: unknown
    const enricher: FeedEnricher = async (ref, context) => {
      receivedBody = (await context.fetchFn(`https://api.example.com/${ref.id}`)).body

      return []
    }
    const enrichFn = createEnrichFeedFn({ enrichers: [enricher], fetchFn: streamFetchFn })

    await enrichFn(aliceRef)

    expect(receivedBody).toBe('{"feed_url":"a.xml"}')
  })

  it('should try the next enricher when one returns undefined', async () => {
    const enrichers: Array<FeedEnricher> = [
      createEnricher('other', 'https://feeds.example.com/other'),
      createEnricher('example', 'https://feeds.example.com/example'),
    ]
    const enrichFn = createEnrichFeedFn({ enrichers, fetchFn })

    expect(await enrichFn(aliceRef)).toEqual(['https://feeds.example.com/example'])
  })

  it('should reject when an enricher throws', async () => {
    const error = new Error('Enrich error')
    const enricher: FeedEnricher = () => {
      throw error
    }
    const enrichFn = createEnrichFeedFn({ enrichers: [enricher], fetchFn })
    const throwing = () => enrichFn(aliceRef)

    await expect(throwing()).rejects.toBe(error)
  })

  it('should return undefined for a ref no enricher answers', async () => {
    const enrichers: Array<FeedEnricher> = [
      createEnricher('other', 'https://feeds.example.com/other'),
    ]
    const enrichFn = createEnrichFeedFn({ enrichers, fetchFn })

    expect(await enrichFn(aliceRef)).toBeUndefined()
  })
})
