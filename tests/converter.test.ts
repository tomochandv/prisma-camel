import { convertPrismaSchema } from '../src/converter'

describe('convertPrismaSchema', () => {
  describe('모델 이름 변환', () => {
    it('should convert snake_case model names to camelCase', () => {
      const input = `model user_profile {
  id Int @id
}`
      const expected = `model userProfile {
  id Int @id
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should handle multiple models', () => {
      const input = `model user_profile {
  id Int @id
}

model blog_post {
  id Int @id
}`
      const expected = `model userProfile {
  id Int @id
}

model blogPost {
  id Int @id
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should not convert models that are already camelCase', () => {
      const input = `model userProfile {
  id Int @id
}`
      expect(convertPrismaSchema(input)).toBe(input)
    })
  })

  describe('필드 이름 변환', () => {
    it('should convert snake_case field names to camelCase and add @map', () => {
      const input = `model User {
  user_name String
  email_address String
}`
      const expected = `model User {
  userName String @map("user_name")
  emailAddress String @map("email_address")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should preserve existing attributes when adding @map', () => {
      const input = `model User {
  user_name String @unique
  created_at DateTime @default(now())
}`
      const expected = `model User {
  userName String @unique @map("user_name")
  createdAt DateTime @default(now()) @map("created_at")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should not add @map if it already exists', () => {
      const input = `model User {
  user_name String @map("user_name")
}`
      const expected = `model User {
  userName String @map("user_name")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should not convert snake_case inside @map()', () => {
      const input = `model User {
  user_name String @map("user_name")
  email_address String @unique @map("email_address")
}`
      const expected = `model User {
  userName String @map("user_name")
  emailAddress String @unique @map("email_address")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should handle fields with @map that are already camelCase', () => {
      const input = `model User {
  userName String @map("user_name")
  emailAddress String @map("email_address")
}`
      // 이미 camelCase라면 변환 안함
      expect(convertPrismaSchema(input)).toBe(input)
    })

    it('should preserve comments', () => {
      const input = `model User {
  user_name String // 사용자 이름
}`
      const expected = `model User {
  userName String @map("user_name") // 사용자 이름
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })
  })

  describe('타입 참조 변환', () => {
    it('should convert snake_case type references in relations', () => {
      const input = `model user_profile {
  id Int @id
  posts blog_post[]
}

model blog_post {
  id Int @id
  author user_profile
}`
      const expected = `model userProfile {
  id Int @id
  posts blogPost[]
}

model blogPost {
  id Int @id
  author userProfile
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should convert field types and relation references', () => {
      const input = `model blog_post {
  author_id Int
  author user_profile @relation(fields: [author_id], references: [id])
}`
      const expected = `model blogPost {
  authorId Int @map("author_id")
  author userProfile @relation(fields: [authorId], references: [id])
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })
  })

  describe('Enum 변환', () => {
    it('should convert snake_case enum names to camelCase', () => {
      const input = `enum user_role {
  ADMIN
  USER
}`
      const expected = `enum userRole {
  ADMIN
  USER
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })
  })

  describe('Type 변환', () => {
    it('should convert snake_case type names to camelCase', () => {
      const input = `type user_data {
  name String
}`
      const expected = `type userData {
  name String
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })
  })

  describe('복합 스키마 변환', () => {
    it('should handle a complete schema with multiple features', () => {
      const input = `generator client {
  provider = "prisma-client-js"
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
  posts           blog_post[]
}

model blog_post {
  id              Int      @id @default(autoincrement())
  post_title      String
  author_id       Int
  author          user_profile @relation(fields: [author_id], references: [id])
}

enum user_role {
  ADMIN
  USER
}`

      const expected = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model userProfile {
  id              Int      @id @default(autoincrement())
  userName       String @map("user_name")
  emailAddress   String   @unique @map("email_address")
  createdAt      DateTime @default(now()) @map("created_at")
  posts           blogPost[]
}

model blogPost {
  id              Int      @id @default(autoincrement())
  postTitle      String @map("post_title")
  authorId       Int @map("author_id")
  author          userProfile @relation(fields: [authorId], references: [id])
}

enum userRole {
  ADMIN
  USER
}`

      expect(convertPrismaSchema(input)).toBe(expected)
    })
  })

  describe('엣지 케이스', () => {
    it('should handle empty lines and spacing', () => {
      const input = `model user_profile {
  id Int @id

  user_name String
}`
      const expected = `model userProfile {
  id Int @id

  userName String @map("user_name")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should not modify generator and datasource blocks', () => {
      const input = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
      expect(convertPrismaSchema(input)).toBe(input)
    })

    it('should handle optional fields with ?', () => {
      const input = `model User {
  published_at DateTime?
}`
      const expected = `model User {
  publishedAt DateTime? @map("published_at")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should handle array types with []', () => {
      const input = `model User {
  post_ids Int[]
}`
      const expected = `model User {
  postIds Int[] @map("post_ids")
}`
      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should handle Prisma 7.0 style generator and datasource blocks', () => {
      const input = `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
}

model user_profile {
  id              Int      @id @default(autoincrement())
  user_name       String
  email_address   String   @unique
}`

      const expected = `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
}

model userProfile {
  id              Int      @id @default(autoincrement())
  userName       String @map("user_name")
  emailAddress   String   @unique @map("email_address")
}`

      expect(convertPrismaSchema(input)).toBe(expected)
    })

    it('should not convert provider/output in generator block', () => {
      const input = `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  binary_targets = ["native"]
}`
      expect(convertPrismaSchema(input)).toBe(input)
    })
  })
})
