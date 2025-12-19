# 🐫 prisma-camel

> Automatically convert snake_case to camelCase in your Prisma schema files

[English](#english) | [한국어](#korean)

---

<a name="english"></a>

## ✨ Features

- 🔄 **Model Names**: `model user_profile` → `model userProfile`
- 📝 **Field Names**: `user_name String` → `userName String @map("user_name")`
- 🎯 **Type & Enum**: Converts `enum user_role` → `enum userRole`
- 💾 **Database Compatible**: Automatically adds `@map()` attributes to maintain DB compatibility
- ⚡ **Prisma 7.0+ Support**: Preserves generator/datasource configurations
- 🎨 **Zero Config**: Works out of the box

## 📦 Installation

### Global Installation

```bash
npm install -g @tomochandv/prisma-camel
```

### Project Installation (Recommended)

```bash
npm install -D @tomochandv/prisma-camel
```

### Or use with npx (No installation)

```bash
npx @tomochandv/prisma-camel
```

## 🚀 Usage

### CLI Commands

```bash
# Convert and overwrite original file
prisma-camel schema.prisma

# Convert and save to new file
prisma-camel schema.prisma schema-camel.prisma

# Using npx
npx @tomochandv/prisma-camel schema.prisma

# With npm scripts (after installing as dev dependency)
npm run prisma-camel schema.prisma
```

### Add to package.json scripts

```json
{
  "scripts": {
    "convert-schema": "prisma-camel prisma/schema.prisma"
  }
}
```

Then run:

```bash
npm run convert-schema
```

### Programmatic Usage

```typescript
import { convertPrismaSchema } from '@tomochandv/prisma-camel'

const schema = `
model user_profile {
  id         Int    @id @default(autoincrement())
  user_name  String
  created_at DateTime @default(now())
}
`

const converted = convertPrismaSchema(schema)
console.log(converted)
```

## 📖 Example

### Before

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model user_profile {
  id              Int      @id @default(autoincrement())
  user_name       String
  email_address   String   @unique
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  posts           blog_post[]
}

model blog_post {
  id              Int      @id @default(autoincrement())
  post_title      String
  post_content    String
  author_id       Int

  author          user_profile @relation(fields: [author_id], references: [id])
}

enum user_role {
  ADMIN
  USER
  GUEST
}
```

### After

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model userProfile {
  id              Int      @id @default(autoincrement())
  userName        String   @map("user_name")
  emailAddress    String   @unique @map("email_address")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  posts           blogPost[]
}

model blogPost {
  id              Int      @id @default(autoincrement())
  postTitle       String   @map("post_title")
  postContent     String   @map("post_content")
  authorId        Int      @map("author_id")

  author          userProfile @relation(fields: [authorId], references: [id])
}

enum userRole {
  ADMIN
  USER
  GUEST
}
```

## 🎯 Key Features

### 1. Database Compatibility

The tool automatically adds `@map()` attributes to preserve your database column names:

```prisma
// Your database still uses snake_case
userName String @map("user_name")
```

### 2. Safe Conversion

- Only converts valid snake_case patterns
- Preserves existing `@map()` attributes
- Maintains comments and formatting
- Keeps generator/datasource blocks unchanged

### 3. Type Reference Updates

Automatically updates model references in relations:

```prisma
author user_profile @relation(...)  // Before
author userProfile @relation(...)   // After
```

## 📚 API

### `convertPrismaSchema(schema: string): string`

Converts a Prisma schema string from snake_case to camelCase.

### `toCamelCase(str: string): string`

Converts a snake_case string to camelCase.

### `isSnakeCase(str: string): boolean`

Checks if a string is in snake_case format.

## 🛠 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format

# Build
npm run build
```

## 📄 License

MIT © tomochandv

## 🤝 Contributing

Issues and pull requests are always welcome!

## 🔗 Links

- [GitHub Repository](https://github.com/tomochandv/prisma-camel)
- [npm Package](https://www.npmjs.com/package/@tomochandv/prisma-camel)

---

<a name="korean"></a>

# 🐫 prisma-camel

> Prisma 스키마 파일의 snake_case를 camelCase로 자동 변환

## ✨ 기능

- 🔄 **모델 이름 변환**: `model user_profile` → `model userProfile`
- 📝 **필드 이름 변환**: `user_name String` → `userName String @map("user_name")`
- 🎯 **타입 & Enum**: `enum user_role` → `enum userRole`
- 💾 **데이터베이스 호환성**: `@map()` 속성 자동 추가로 DB와 호환성 유지
- ⚡ **Prisma 7.0+ 지원**: generator/datasource 설정 보존
- 🎨 **별도 설정 불필요**: 바로 사용 가능

## 📦 설치

### 전역 설치

```bash
npm install -g @tomochandv/prisma-camel
```

### 프로젝트 설치 (권장)

```bash
npm install -D @tomochandv/prisma-camel
```

### npx로 설치 없이 사용

```bash
npx @tomochandv/prisma-camel
```

## 🚀 사용법

### CLI 명령어

```bash
# 원본 파일 덮어쓰기
prisma-camel schema.prisma

# 새 파일로 저장
prisma-camel schema.prisma schema-camel.prisma

# npx 사용
npx @tomochandv/prisma-camel schema.prisma

# npm scripts 사용 (dev dependency로 설치 후)
npm run prisma-camel schema.prisma
```

### package.json에 스크립트 추가

```json
{
  "scripts": {
    "convert-schema": "prisma-camel prisma/schema.prisma"
  }
}
```

실행:

```bash
npm run convert-schema
```

### 프로그래밍 방식 사용

```typescript
import { convertPrismaSchema } from '@tomochandv/prisma-camel'

const schema = `
model user_profile {
  id         Int    @id @default(autoincrement())
  user_name  String
  created_at DateTime @default(now())
}
`

const converted = convertPrismaSchema(schema)
console.log(converted)
```

## 📖 변환 예시

변환 예시는 [위 영어 섹션](#example)을 참고하세요.

## 🎯 주요 특징

### 1. 데이터베이스 호환성

자동으로 `@map()` 속성을 추가하여 데이터베이스 컬럼명을 유지합니다:

```prisma
// 데이터베이스는 여전히 snake_case 사용
userName String @map("user_name")
```

### 2. 안전한 변환

- 유효한 snake_case 패턴만 변환
- 기존 `@map()` 속성 보존
- 주석 및 포맷팅 유지
- generator/datasource 블록은 변경하지 않음

### 3. 타입 참조 자동 업데이트

relation의 모델 참조를 자동으로 업데이트:

```prisma
author user_profile @relation(...)  // 변환 전
author userProfile @relation(...)   // 변환 후
```

## 📚 API

### `convertPrismaSchema(schema: string): string`

Prisma 스키마 문자열을 snake_case에서 camelCase로 변환합니다.

### `toCamelCase(str: string): string`

snake_case 문자열을 camelCase로 변환합니다.

### `isSnakeCase(str: string): boolean`

문자열이 snake_case 형식인지 확인합니다.

## 🛠 개발

```bash
# 의존성 설치
npm install

# 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage

# 린트
npm run lint

# 코드 포맷팅
npm run format

# 빌드
npm run build
```

## 📄 라이선스

MIT © tomochandv

## 🤝 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!

## 🔗 링크

- [GitHub 저장소](https://github.com/tomochandv/prisma-camel)
- [npm 패키지](https://www.npmjs.com/package/@tomochandv/prisma-camel)
