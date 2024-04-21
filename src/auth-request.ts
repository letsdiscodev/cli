import EventSource, {EventSourceInitDict} from 'eventsource'
import fetch from 'node-fetch'

import {DiscoConfig} from './config'
import {Readable} from 'node:stream'

export interface EventWithMessage extends Event {
  message?: string
}

interface Handlers {
  onMessage: (event: MessageEvent) => void
}

export function readEventSource(url: string, discoConfig: DiscoConfig, handlers: Handlers) {
  const params: EventSourceInitDict = {
    headers: {
      Accept: 'text/event-stream',
      Authorization: 'Basic ' + Buffer.from(`${discoConfig.apiKey}:`).toString('base64'),
    },
  }

  const es = new EventSource(url, params)
  // don't catch errors -- let eventsource 'handle'
  // them by trying to reconnect..?
  // ... or throw error and close connection?
  // 'output' is our way of saying that we're sending a message
  es.addEventListener('output', handlers.onMessage)
  // sending 'end' is our way of signaling that we want to close the connection
  es.addEventListener('end', () => {
    es.close()
  })
}

export function request({
  method,
  url,
  discoConfig,
  body,
  expectedStatuses = [200],
  bodyStream,
}: {
  method: string
  url: string
  discoConfig: DiscoConfig
  body?: unknown
  expectedStatuses?: number[]
  bodyStream?: Readable
}) {
  const params: fetch.RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${discoConfig.apiKey}:`).toString('base64'),
    },
  }

  if (method === 'POST') {
    params.headers = {
      ...params.headers,
      'Content-Type': 'application/json',
    }
    params.body = JSON.stringify(body)
  }

  if (bodyStream) {
    params.body = bodyStream
  }

  return fetch(url, params).then(async (res) => {
    if (!expectedStatuses.includes(res.status)) {
      throw new Error(`HTTP error: ${res.status} ${await res.text()}`)
    }

    // send back the server response so that caller
    // can access .status and .json
    return res
  })
}
