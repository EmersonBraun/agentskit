'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export type FadeInProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 12,
  once = true,
}: FadeInProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}

export type StaggerProps = {
  children: ReactNode
  className?: string
  stagger?: number
  once?: boolean
}

export function Stagger({
  children,
  className,
  stagger = 0.05,
  once = true,
}: StaggerProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
      variants={{
        visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  y = 12,
}: {
  children: ReactNode
  className?: string
  y?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  )
}
