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

    expect(await enrichFn([aliceRef])).toEqual([['https://cdn.example.com/alice.png']])
  })

  it('should pass the given fetchFn to the enricher in its context', async () => {
    let receivedFetchFn: FetchFn | undefined
    const enricher: FaviconEnricher = (_ref, context) => {
      receivedFetchFn = context.fetchFn

      return []
    }
    const enrichFn = createEnrichFaviconFn({ enrichers: [enricher], fetchFn })

    await enrichFn([aliceRef])

    expect(receivedFetchFn).toBe(fetchFn)
  })

  it('should try the next enricher when one returns undefined', async () => {
    const enrichers: Array<FaviconEnricher> = [
      createEnricher('other', 'https://cdn.example.com/other.png'),
      createEnricher('example', 'https://cdn.example.com/example.png'),
    ]
    const enrichFn = createEnrichFaviconFn({ enrichers, fetchFn })

    expect(await enrichFn([aliceRef])).toEqual([['https://cdn.example.com/example.png']])
  })

  it('should reject when an enricher throws', async () => {
    const error = new Error('Enrich error')
    const enricher: FaviconEnricher = () => {
      throw error
    }
    const enrichFn = createEnrichFaviconFn({ enrichers: [enricher], fetchFn })

    await expect(enrichFn([aliceRef])).rejects.toBe(error)
  })

  it('should return undefined for a ref no enricher answers', async () => {
    const enrichers: Array<FaviconEnricher> = [
      createEnricher('other', 'https://cdn.example.com/other.png'),
    ]
    const enrichFn = createEnrichFaviconFn({ enrichers, fetchFn })

    expect(await enrichFn([aliceRef])).toEqual([undefined])
  })

  it('should return one entry per ref in the order of the refs', async () => {
    const enrichers: Array<FaviconEnricher> = [
      createEnricher('first', 'https://cdn.example.com/first.png'),
      createEnricher('second', 'https://cdn.example.com/second.png'),
    ]
    const refs: Array<DiscoverRef> = [
      { platform: 'second', id: 'bob', url: 'https://example.com/@bob' },
      { platform: 'missing', id: 'carol', url: 'https://example.com/@carol' },
      { platform: 'first', id: 'alice', url: 'https://example.com/@alice' },
    ]
    const enrichFn = createEnrichFaviconFn({ enrichers, fetchFn })
    const expected = [
      ['https://cdn.example.com/second.png'],
      undefined,
      ['https://cdn.example.com/first.png'],
    ]

    expect(await enrichFn(refs)).toEqual(expected)
  })
})
