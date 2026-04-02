import React, { type ReactNode } from 'react'
import type { Message as MessageType } from '../core/types'

export interface MessageProps {
  message: MessageType
  avatar?: ReactNode
  actions?: ReactNode
}

export function Message({ message, avatar, actions }: MessageProps) {
  return (
    <div
      data-ra-message=""
      data-ra-role={message.role}
      data-ra-status={message.status}
    >
      {avatar && <div data-ra-avatar="">{avatar}</div>}
      <div data-ra-content="">{message.content}</div>
      {actions && <div data-ra-actions="">{actions}</div>}
    </div>
  )
}
