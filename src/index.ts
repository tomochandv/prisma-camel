#!/usr/bin/env node

import * as fs from 'fs'
import { convertPrismaSchema } from './converter'

export { convertPrismaSchema } from './converter'
export { toCamelCase, isSnakeCase } from './utils'

/**
 * CLI execution function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🐫 prisma-camel - Convert Prisma schema from snake_case to camelCase

Usage:
  npx @tomochandv/prisma-camel <schema-file> [output-file]
  npx @tomochandv/prisma-camel --help

Arguments:
  <schema-file>   Path to the Prisma schema file to convert
  [output-file]   Output file path (optional, defaults to overwriting the original file)

Examples:
  npx @tomochandv/prisma-camel schema.prisma
  npx @tomochandv/prisma-camel schema.prisma schema-camel.prisma
`)
    process.exit(0)
  }

  const inputFile = args[0]
  const outputFile = args[1] || inputFile

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`\n❌ Error: File not found: ${inputFile}\n`)
    process.exit(1)
  }

  try {
    console.log('\n🐫 prisma-camel\n')
    console.log(`📖 Reading schema file: ${inputFile}`)

    // Read schema file
    const schema = fs.readFileSync(inputFile, 'utf-8')

    console.log('🔄 Converting snake_case to camelCase...')

    // Convert
    const converted = convertPrismaSchema(schema)

    console.log(`💾 Writing to: ${outputFile}`)

    // Save result
    fs.writeFileSync(outputFile, converted, 'utf-8')

    console.log('\n✨ Success! Schema converted successfully!\n')
  } catch (error) {
    console.error('\n❌ Error occurred:', error)
    console.error()
    process.exit(1)
  }
}

// CLI로 실행된 경우에만 main 함수 실행
if (require.main === module) {
  main()
}
