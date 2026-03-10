import { describe, expect, it } from 'bun:test'
import type { FaviconResult } from '../discover/types.js'
import { discoverFaviconsFromGuess } from './index.js'

describe('discoverFaviconsFromGuess', () => {
  it('should return favicon URLs for known paths', () => {
    const value = discoverFaviconsFromGuess('https://example.com/')
    const expected: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'guess' },
      { url: 'https://example.com/apple-touch-icon.png', method: 'guess' },
      { url: 'https://example.com/apple-touch-icon-precomposed.png', method: 'guess' },
      { url: 'https://example.com/favicon.png', method: 'guess' },
      { url: 'https://example.com/favicon.svg', method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should use origin only, ignoring path', () => {
    const value = discoverFaviconsFromGuess('https://example.com/blog/post/123')
    const expected: Array<FaviconResult> = [
      { url: 'https://example.com/favicon.ico', method: 'guess' },
      { url: 'https://example.com/apple-touch-icon.png', method: 'guess' },
      { url: 'https://example.com/apple-touch-icon-precomposed.png', method: 'guess' },
      { url: 'https://example.com/favicon.png', method: 'guess' },
      { url: 'https://example.com/favicon.svg', method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle URL with port', () => {
    const value = discoverFaviconsFromGuess('https://example.com:8080/page')
    const expected: Array<FaviconResult> = [
      { url: 'https://example.com:8080/favicon.ico', method: 'guess' },
      { url: 'https://example.com:8080/apple-touch-icon.png', method: 'guess' },
      { url: 'https://example.com:8080/apple-touch-icon-precomposed.png', method: 'guess' },
      { url: 'https://example.com:8080/favicon.png', method: 'guess' },
      { url: 'https://example.com:8080/favicon.svg', method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should use custom paths', () => {
    const value = discoverFaviconsFromGuess('https://example.com/', {
      paths: ['/icon.png', '/logo.svg'],
    })
    const expected: Array<FaviconResult> = [
      { url: 'https://example.com/icon.png', method: 'guess' },
      { url: 'https://example.com/logo.svg', method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array for empty paths', () => {
    const value = discoverFaviconsFromGuess('https://example.com/', { paths: [] })

    expect(value).toEqual([])
  })

  it('should return empty array for invalid URL', () => {
    const value = discoverFaviconsFromGuess('not-a-url')

    expect(value).toEqual([])
  })
})
