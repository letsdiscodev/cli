import EventSource, {EventSourceInitDict} from 'eventsource'
import * as fs from 'node:fs'
import * as https from 'node:https'
import fetch from 'node-fetch'

import {DiscoConfig, certPath} from './config'

export interface EventWithMessage extends Event {
  message?: string
}

interface Handlers {
  onError: (event: EventWithMessage) => void
  onMessage: (event: MessageEvent) => void
}

export function readEventSource(url: string, discoConfig: DiscoConfig, handlers: Handlers) {
  const params: EventSourceInitDict = {
    headers: {
      Accept: 'text/event-stream',
      Authorization: 'Basic ' + Buffer.from(`${discoConfig.apiKey}:`).toString('base64'),
    },
  }

  if (discoConfig.host === discoConfig.ip) {
    params.https = {
      ca: fs.readFileSync(certPath(discoConfig.ip)),
      rejectUnauthorized: true,
    }
  }

  const es = new EventSource(url, params)
  es.addEventListener('message', handlers.onMessage)
  es.addEventListener('error', handlers.onError)
}

export function request({
  method,
  url,
  discoConfig,
  body,
}: {
  method: string
  url: string
  discoConfig: DiscoConfig
  body?: unknown
}) {
  const sslConfiguredAgent = new https.Agent({
    ca: fs.readFileSync(certPath(discoConfig.ip)),
    rejectUnauthorized: true,
  })

  const params: fetch.RequestInit = {
    method,
    agent: sslConfiguredAgent,
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

  return fetch(url, params).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`)
    }

    return res.json()
  })
}
