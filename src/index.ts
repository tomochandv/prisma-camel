#!/usr/bin/env node

import * as fs from 'fs'
import { convertPrismaSchema } from './converter'

export { convertPrismaSchema } from './converter'
export { toCamelCase, isSnakeCase } from './utils'

/**
 * CLI 실행 함수
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
prisma-camel - Prisma 스키마의 snake_case를 camelCase로 변환

사용법:
  npx @tomochanshim/prisma-camel <schema-file> [output-file]
  npx @tomochanshim/prisma-camel --help

인수:
  <schema-file>   변환할 Prisma 스키마 파일 경로
  [output-file]   출력 파일 경로 (선택사항, 기본값: 원본 파일 덮어쓰기)

예시:
  npx @tomochanshim/prisma-camel schema.prisma
  npx @tomochanshim/prisma-camel schema.prisma schema-camel.prisma
`)
    process.exit(0)
  }

  const inputFile = args[0]
  const outputFile = args[1] || inputFile

  // 입력 파일 존재 확인
  if (!fs.existsSync(inputFile)) {
    console.error(`오류: 파일을 찾을 수 없습니다: ${inputFile}`)
    process.exit(1)
  }

  try {
    // 스키마 파일 읽기
    const schema = fs.readFileSync(inputFile, 'utf-8')

    // 변환
    const converted = convertPrismaSchema(schema)

    // 결과 저장
    fs.writeFileSync(outputFile, converted, 'utf-8')

    console.log(`✓ 변환 완료: ${outputFile}`)
  } catch (error) {
    console.error('오류 발생:', error)
    process.exit(1)
  }
}

// CLI로 실행된 경우에만 main 함수 실행
if (require.main === module) {
  main()
}
