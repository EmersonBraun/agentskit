import type { Message, StreamChunk } from '../core/types'

export interface CreateAdapterConfig {
  send: (messages: Message[]) => Promise<ReadableStream | Response>
  parse: (stream: ReadableStream) => AsyncIterableIterator<StreamChunk>
  abort?: () => void
}

export interface GenericAdapterConfig {
  send: (messages: Message[]) => Promise<ReadableStream>
}
