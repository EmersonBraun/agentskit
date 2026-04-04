import type { AdapterRequest, StreamChunk } from '@agentskit/core'

export interface CreateAdapterConfig {
  send: (request: AdapterRequest) => Promise<ReadableStream | Response>
  parse: (stream: ReadableStream) => AsyncIterableIterator<StreamChunk>
  abort?: () => void
}

export interface GenericAdapterConfig {
  send: (request: AdapterRequest) => Promise<ReadableStream>
}
