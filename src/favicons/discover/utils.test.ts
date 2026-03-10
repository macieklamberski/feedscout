import { describe, expect, it } from 'bun:test'
import type { FaviconResult } from '../types.js'
import { deduplicateResults } from './utils.js'

describe('deduplicateResults', () => {
  it('should return all results when no duplicates', () => {
    const results: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      { url: 'https://example.com/icon.png', method: 'guess' },
    ]
    const value = deduplicateResults(results)

    expect(value).toEqual(results)
  })

  it('should remove duplicate URLs keeping first occurrence', () => {
    const results: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      { url: 'https://example.com/favicon.ico', method: 'guess' },
    ]
    const value = deduplicateResults(results)
    const expected: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle multiple duplicates across methods', () => {
    const results: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      { url: 'https://example.com/icon.png', method: 'html', rel: 'icon' },
      { url: 'https://example.com/favicon.ico', method: 'headers', rel: 'icon' },
      { url: 'https://example.com/icon.png', method: 'guess' },
      { url: 'https://example.com/favicon.ico', method: 'guess' },
    ]
    const value = deduplicateResults(results)
    const expected: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      { url: 'https://example.com/icon.png', method: 'html', rel: 'icon' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array for empty input', () => {
    const value = deduplicateResults([])

    expect(value).toEqual([])
  })
})
