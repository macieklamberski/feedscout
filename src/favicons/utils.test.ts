import { describe, expect, it } from 'bun:test'
import type { FetchFnResponse } from '../common/types.js'
import { createStatusError, getResponseText, parseResponseJson } from './utils.js'

const createResponse = (
  body: FetchFnResponse['body'],
  status = 200,
  url = 'https://example.com/api',
): FetchFnResponse => {
  return { headers: new Headers(), body, url, status }
}

describe('createStatusError', () => {
  it('should carry the status and URL in the message and the cause', () => {
    const value = createResponse('Not Found', 404)
    const expected = {
      message: 'Unexpected status 404 from https://example.com/api',
      cause: {
        status: 404,
        url: 'https://example.com/api',
      },
    }

    expect(createStatusError(value)).toMatchObject(expected)
  })
})

describe('getResponseText', () => {
  it('should return the body of a successful response', () => {
    expect(getResponseText(createResponse('<html></html>'))).toBe('<html></html>')
  })

  it('should throw when the body is a ReadableStream', () => {
    const throwing = () => getResponseText(createResponse(new ReadableStream()))

    expect(throwing).toThrow('Unexpected stream body from https://example.com/api')
  })

  it('should throw on a non-2xx response with the status and URL', () => {
    const throwing = () => getResponseText(createResponse('Not Found', 404))

    expect(throwing).toThrow('Unexpected status 404 from https://example.com/api')
  })
})

describe('parseResponseJson', () => {
  it('should parse valid JSON string', () => {
    expect(parseResponseJson(createResponse('{"key":"value"}'))).toEqual({ key: 'value' })
  })

  it('should parse JSON arrays', () => {
    expect(parseResponseJson(createResponse('[1,2,3]'))).toEqual([1, 2, 3])
  })

  it('should throw on invalid JSON string', () => {
    const throwing = () => parseResponseJson(createResponse('not-json'))

    expect(throwing).toThrow()
  })

  it('should throw when body is a ReadableStream', () => {
    const throwing = () => parseResponseJson(createResponse(new ReadableStream()))

    expect(throwing).toThrow('Unexpected stream body')
  })

  it('should throw on empty string', () => {
    const throwing = () => parseResponseJson(createResponse(''))

    expect(throwing).toThrow()
  })

  it('should throw on a non-2xx response with a JSON body', () => {
    const throwing = () => parseResponseJson(createResponse('{"error":"not found"}', 404))

    expect(throwing).toThrow('Unexpected status 404')
  })
})
