import type { FetchFnResponse } from '../common/types.js'
import { isSuccessfulStatus } from '../common/utils.js'

// The status and URL ride in the cause, so an onError consumer can tell a 404 from a 500 without
// parsing the message.
export const createStatusError = (response: FetchFnResponse): Error => {
  return new Error(`Unexpected status ${response.status} from ${response.url}`, {
    cause: {
      status: response.status,
      url: response.url,
    },
  })
}

// A non-2xx response carries an error page, not the data an enricher asked for.
export const getResponseText = (response: FetchFnResponse): string => {
  if (!isSuccessfulStatus(response.status)) {
    throw createStatusError(response)
  }

  if (typeof response.body !== 'string') {
    throw new Error(`Unexpected stream body from ${response.url}`)
  }

  return response.body
}

// biome-ignore lint/suspicious/noExplicitAny: Matches JSON.parse return type.
export const parseResponseJson = (response: FetchFnResponse): any => {
  return JSON.parse(getResponseText(response))
}
