import { defineCommand } from 'citty'
import { addMcp } from '../ruler'

export async function runRuler () {
  await addMcp()
}

export const rulerCommand = defineCommand({
  meta: {
    name: 'ruler',
    description: 'Add Ruler to current project',
  },
  run: async () => {
    await runRuler()
  },
})
