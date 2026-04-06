import type { SkillDefinition } from '@agentskit/core'
import { researcher } from './researcher'
import { coder } from './coder'
import { planner } from './planner'
import { critic } from './critic'
import { summarizer } from './summarizer'

export interface SkillMetadata {
  name: string
  description: string
  tools: string[]
  delegates: string[]
}

function extractMetadata(skill: SkillDefinition): SkillMetadata {
  return {
    name: skill.name,
    description: skill.description,
    tools: skill.tools ?? [],
    delegates: skill.delegates ?? [],
  }
}

export function listSkills(): SkillMetadata[] {
  return [researcher, coder, planner, critic, summarizer].map(extractMetadata)
}
