Prisma最佳实践

- 这个 `server` 项目里，Prisma 主要承担 3 件事：定义数据模型、生成类型安全的数据库访问客户端、管理数据库迁移。
- 它在项目中的落点很清晰：
  - 数据模型定义在 [schema.prisma](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/schema.prisma#L1-L20)
  - 迁移 SQL 在 [migration.sql](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/migrations/20260327124535_init_auth/migration.sql#L1-L16)
  - Prisma 运行时封装在 [prisma.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/database/prisma/prisma.service.ts#L1-L18)
  - 业务层通过 [users.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/users/users.service.ts#L1-L49) 调用 Prisma
  - 脚本命令在 [package.json](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/package.json#L8-L30)

**Prisma 在这个项目里的工作流**

- 你先在 `schema.prisma` 里写模型。
- 然后执行 `prisma generate`，生成 `@prisma/client`。
- 再执行 `prisma migrate dev`，把模型变化转换成数据库表结构。
- NestJS 启动时通过 `PrismaService` 建立数据库连接。
- 业务代码里注入 `PrismaService`，用 `prisma.user.findUnique()`、`prisma.user.create()` 这类 API 读写数据。

---

**1. schema.prisma 是核心**

当前 schema 很小，但已经体现了 Prisma 最重要的概念：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  passwordHash     String
  refreshTokenHash String?
  lastLoginAt      DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@map("users")
}
```

对应位置在 [schema.prisma](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/schema.prisma#L1-L20)。

**这里每一部分的含义：**

- `generator client`
  - 告诉 Prisma 生成 JS/TS 客户端。
  - 生成后你就能在代码里 `import { PrismaClient } from '@prisma/client'`。

- `datasource db`
  - 指定数据库类型是 PostgreSQL。
  - 这里没有直接写 `url = env("DATABASE_URL")`，因为这个项目把连接地址放到了 [prisma.config.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma.config.ts#L1-L9) 里统一配置。

- `model User`
  - 定义一个 Prisma 模型，Prisma 会基于它推导 TS 类型、查询 API、迁移 SQL。

**字段解释：**

- `id String @id @default(cuid())`
  - 主键，字符串类型，默认用 `cuid()` 生成。
  - 所以创建用户时不需要手动传 `id`。

- `email String @unique`
  - 唯一字段。
  - Prisma 会在数据库里建立唯一索引，所以重复注册会触发唯一约束错误。

- `name String?`
  - `?` 表示可空，对应数据库允许 `NULL`。

- `passwordHash String`
  - 存储密码哈希，不存明文密码。

- `refreshTokenHash String?`
  - 用于存刷新令牌的哈希，可空，登出后可清空。

- `lastLoginAt DateTime?`
  - 最后登录时间，可空。

- `createdAt DateTime @default(now())`
  - 创建时间，默认取当前时间。

- `updatedAt DateTime @updatedAt`
  - 每次更新该记录时，Prisma 自动改写这个字段。

- `@@map("users")`
  - Prisma 模型名叫 `User`，但数据库真实表名映射为 `users`。
  - 这能让代码层保持 PascalCase 命名，而数据库层使用复数表名。

---

**2. 迁移文件是怎么来的**

模型定义之后，Prisma 会生成数据库迁移。当前项目已有初始化迁移：

- [migration.sql](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/migrations/20260327124535_init_auth/migration.sql#L1-L16)

它做了两件事：

- 创建 `users` 表
- 给 `email` 建唯一索引

你会看到它和 schema 是一一对应的：

- `User` → `users`
- `email @unique` → `CREATE UNIQUE INDEX`
- `createdAt @default(now())` → `DEFAULT CURRENT_TIMESTAMP`

这就是 Prisma 的一个核心价值：  
**你维护的是模型，迁移 SQL 由 Prisma 帮你生成。**

---

**3. 这个项目为什么 schema 里没写 DATABASE_URL**

这是这个仓库比较值得注意的一点。

Prisma 配置在 [prisma.config.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma.config.ts#L1-L9)：

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

说明：

- Prisma CLI 读的是这个配置文件。
- `DATABASE_URL` 从环境变量加载，而不是硬编码在 schema。
- 这样更适合多环境：
  - 开发环境 `.env.development`
  - 生产环境 `.env.production`

这个项目的脚本也印证了这点：

- [package.json](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/package.json#L21-L24)

例如：

- `prisma:generate`：用 `.env.development` 执行 `prisma generate`
- `prisma:migrate:dev`：用 `.env.development` 执行开发迁移
- `prisma:migrate:deploy`：用 `.env.production` 执行生产迁移

这属于比较规范的做法。

---

**4. NestJS 里怎么接入 Prisma**

这个项目没有直接在每个地方 `new PrismaClient()`，而是封装成了全局服务。

看 [prisma.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/database/prisma/prisma.service.ts#L1-L18)：

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

**这里有几个关键点：**

- `PrismaService extends PrismaClient`
  - 说明 `PrismaService` 本质上就是 Prisma Client 的增强版。
  - 所以注入后可以直接用 `this.prismaService.user.findUnique()`。

- `implements OnModuleInit`
  - Nest 模块初始化时自动执行 `onModuleInit()`。
  - 里面调用 `$connect()`，确保应用启动时建立数据库连接。

- `new PrismaPg(...)`
  - 这是 Prisma 的 PostgreSQL driver adapter。
  - 这个项目没有走 Prisma 传统的默认数据库驱动方式，而是显式使用 `@prisma/adapter-pg`。

这意味着当前项目的 Prisma 运行时链路是：

- 环境变量提供连接串
- PrismaPg 作为 PostgreSQL adapter
- PrismaClient 基于 adapter 建立连接
- Nest 中通过 `PrismaService` 对外暴露

---

**5. 为什么 PrismaModule 要做成全局模块**

看 [prisma.module.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/database/prisma/prisma.module.ts#L1-L9)：

```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

以及 [app.module.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/app.module.ts#L13-L18)：

- `PrismaModule` 被导入到了根模块。

意义是：

- `@Global()` 让 `PrismaService` 在整个应用中可直接注入。
- 其他业务模块不需要反复 import `PrismaModule`。
- 这是 Nest 项目里很常见的数据库模块组织方式。

---

**6. 业务层是怎么使用 Prisma 的**

最典型的是 [users.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/users/users.service.ts#L1-L49)。

它把 Prisma 操作封装成用户领域服务：

```ts
async create(data: Prisma.UserCreateInput): Promise<User> {
  return this.prismaService.user.create({ data });
}

async findById(id: string): Promise<User | null> {
  return this.prismaService.user.findUnique({ where: { id } });
}

async findByEmail(email: string): Promise<User | null> {
  return this.prismaService.user.findUnique({ where: { email } });
}
```

**这一层设计很合理：**

- 控制器和认证服务不直接写 Prisma 查询
- 数据库访问集中在 `UsersService`
- 以后换表结构或加事务时，更容易维护

**Prisma API 风格你可以这样理解：**

- `prisma.user.create({ data })`：插入一条用户数据
- `prisma.user.findUnique({ where: { email } })`：按唯一键查一条
- `prisma.user.update({ where, data })`：更新一条

例如项目里更新 refresh token：

- [users.service.ts:L22-L37](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/users/users.service.ts#L22-L37)

这段说明 Prisma 的更新语法非常统一：

```ts
await this.prismaService.user.update({
  where: { id: userId },
  data: { refreshTokenHash },
});
```

---

**7. Prisma 类型安全在这里怎么体现**

看 [users.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/users/users.service.ts#L1-L49) 的导入：

- `Prisma`
- `User`

这两个都来自 `@prisma/client`。

作用分别是：

- `User`
  - 对应数据库里的用户记录类型
  - 能让方法返回值精确为 `Promise<User>` 或 `Promise<User | null>`

- `Prisma.UserCreateInput`
  - Prisma 自动生成的创建输入类型
  - 这样你传给 `create()` 的对象字段如果不合法，TS 编译期就能报错

这就是 Prisma 很强的一点：  
**数据库模型变成 TS 类型系统的一部分。**

---

**8. Prisma 错误处理在这个项目里怎么做**

看 [auth.service.ts:L47-L56](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/auth/auth.service.ts#L47-L56)：

```ts
if (
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002'
) {
  throw new ConflictException('邮箱已被注册');
}
```

这段非常典型。

**含义：**

- `P2002` 是 Prisma 已知错误码，表示唯一约束冲突。
- 这里用户注册时，如果 email 重复，就把底层数据库错误翻译成业务异常 `409 Conflict`。

这是 Prisma 在业务开发里常见的套路：

- 数据一致性约束交给数据库
- 业务层捕获 Prisma 异常码
- 转成更友好的 HTTP 错误

---

**9. 这个项目里 Prisma 命令怎么用**

参考 [package.json](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/package.json#L15-L24)。

**常用命令：**

- `npm run prisma:generate`
  - 根据 `schema.prisma` 重新生成 Prisma Client
  - 当你修改模型后，通常先跑这个

- `npm run prisma:migrate:dev`
  - 生成并应用开发迁移
  - 适合本地开发阶段变更表结构

- `npm run prisma:migrate:deploy`
  - 在生产环境执行已有迁移
  - 适合部署时用

- `npm run prisma:studio`
  - 打开 Prisma Studio
  - 可以图形化查看和编辑数据库数据

- `npm run start:local`
  - 启动数据库容器
  - 生成 Prisma Client
  - 执行迁移
  - 再启动 Nest 开发服务

这条命令很适合第一次启动项目。

---

**10. 你在这个项目里新增一个表，应该怎么做**

假设你要新增一个 `Post` 模型，标准流程是：

**第一步：改 schema**

在 [schema.prisma](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/schema.prisma) 增加：

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

如果要和 `User` 建关系，还会继续加 relation 字段。

**第二步：生成客户端**

```bash
npm run prisma:generate
```

**第三步：生成迁移并应用**

```bash
npm run prisma:migrate:dev
```

**第四步：在业务层封装查询**

像现在的 `UsersService` 一样，新增 `PostsService`，通过 `PrismaService` 操作：

```ts
this.prismaService.post.create({ data: ... })
this.prismaService.post.findMany()
```

**第五步：在控制器/业务模块里调用**

不要在控制器里直接写 Prisma，尽量保持和现在项目一样的分层。

---

**11. Prisma 常用查询语法，结合这个项目最容易理解的版本**

以 `User` 为例。

**创建**

```ts
await prisma.user.create({
  data: {
    email: 'a@test.com',
    passwordHash: 'hashed',
    name: 'Tom',
  },
});
```

**按唯一字段查单条**

```ts
await prisma.user.findUnique({
  where: { email: 'a@test.com' },
});
```

**更新**

```ts
await prisma.user.update({
  where: { id: userId },
  data: { lastLoginAt: new Date() },
});
```

**查多条**

```ts
await prisma.user.findMany({
  where: { name: { not: null } },
  orderBy: { createdAt: 'desc' },
});
```

**删除**

```ts
await prisma.user.delete({
  where: { id: userId },
});
```

Prisma 查询对象的特点是：

- `where` 控制筛选
- `data` 控制写入内容
- `select` 控制返回字段
- `include` 控制关联展开
- `orderBy` 控制排序
- `take/skip` 控制分页

---

**12. 这个项目当前 Prisma 设计的优点**

- **分层清晰**
  - 数据访问在 `UsersService`
  - 认证业务在 `AuthService`
  - 没有把 SQL/ORM 调用散落到控制器里

- **类型安全**
  - Prisma 模型生成 TS 类型，减少手写 DTO 和数据库结构不一致的问题

- **迁移可追踪**
  - 迁移 SQL 已落地在 `prisma/migrations`，部署更稳定

- **环境隔离**
  - 开发、生产用不同 env 文件，避免误连数据库

- **异常处理规范**
  - 唯一约束错误通过 Prisma 错误码转换成业务异常

---

**13. 这个项目当前 Prisma 设计里你要特别注意的点**

- `datasource db` 里没有 `url`
  - 不是漏写，是由 [prisma.config.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma.config.ts#L1-L9) 提供
  - 如果你照传统教程改 schema，可能会和当前项目配置风格不一致

- 使用了 `@prisma/adapter-pg`
  - 说明这是 Prisma 新一点的接入方式
  - 后续你写初始化代码时，要遵循当前的 adapter 模式

- `User` 模型用了 `@@map("users")`
  - 代码里操作的是 `user`
  - 数据库实际表是 `users`
  - 排查 SQL 问题时要记住这个映射关系

- `updatedAt @updatedAt`
  - 不需要手动赋值
  - Prisma 更新记录时会自动维护

---

**14. 如果你想真正学会这个项目里的 Prisma，建议按这个顺序理解**

- 先看模型定义：[schema.prisma](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/schema.prisma#L1-L20)
- 再看迁移结果：[migration.sql](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/prisma/migrations/20260327124535_init_auth/migration.sql#L1-L16)
- 再看 Prisma 初始化：[prisma.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/database/prisma/prisma.service.ts#L1-L18)
- 再看业务封装：[users.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/users/users.service.ts#L1-L49)
- 最后看异常处理：[auth.service.ts](file:///Users/ssngyu/Desktop/my-workspace/ai-chat/server/src/modules/auth/auth.service.ts#L47-L56)

这样你会从“模型 → 数据库 → 客户端 → 业务代码”完整串起来。

**一句话总结**

- 在这个 `server` 项目里，Prisma 不是单纯“拿来查库”的工具，而是贯穿了：
  - 表结构设计
  - 迁移管理
  - TS 类型生成
  - NestJS 数据访问封装
  - 业务异常处理

如果你愿意，我下一步可以继续直接给你讲两种更深入的内容之一：

- **按这个项目手把手演示新增一个 Prisma 模型**
- **详细讲 Prisma 的关联关系、事务、分页、select/include 用法**
