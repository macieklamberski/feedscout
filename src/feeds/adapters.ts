import type { FetchFn } from '../common/types.js'

// biome-ignore lint/suspicious/noExplicitAny: To avoid importing the types from libraries.
type AnyInstance = any

export const createNativeFetchAdapter = (baseOptions?: RequestInit): FetchFn => {
  return async (url, options) => {
    const response = await fetch(url, {
      ...baseOptions,
      method: options?.method || 'GET',
      headers: {
        ...baseOptions?.headers,
        ...options?.headers,
      },
    })

    return {
      headers: response.headers,
      body: await response.text(),
      url: response.url,
      status: response.status,
      statusText: response.statusText,
    }
  }
}

export const createGotAdapter = (gotInstance: AnyInstance): FetchFn => {
  return async (url, options) => {
    const response = await gotInstance(url, {
      method: options?.method || 'GET',
      headers: options?.headers,
      throwHttpErrors: false,
    })

    return {
      headers: new Headers(response.headers as Record<string, string>),
      body: response.body,
      url: response.url,
      status: response.statusCode,
      statusText: response.statusMessage,
    }
  }
}

export const createAxiosAdapter = (axiosInstance: AnyInstance): FetchFn => {
  return async (url, options) => {
    const response = await axiosInstance({
      url,
      method: options?.method || 'GET',
      headers: options?.headers,
      validateStatus: () => true,
    })

    return {
      headers: new Headers(response.headers as Record<string, string>),
      body: response.data,
      url: response.request?.res?.responseUrl || url,
      status: response.status,
      statusText: response.statusText,
    }
  }
}

export const createKyAdapter = (kyInstance: AnyInstance): FetchFn => {
  return async (url, options) => {
    const response = await kyInstance(url, {
      method: options?.method || 'GET',
      headers: options?.headers,
      throwHttpErrors: false,
    })

    return {
      headers: response.headers,
      body: await response.text(),
      url: response.url,
      status: response.status,
      statusText: response.statusText,
    }
  }
}
