import { createCli } from './commands'

async function main() {
  await createCli().parseAsync(process.argv)
}

void main()
