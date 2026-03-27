### 标准的目录结构

my-nestjs-project/
├── src/
│ ├── common/ # 公共资源目录 (跨模块复用的组件)
│ │ ├── decorators/ # 自定义装饰器 (例如: @CurrentUser)
│ │ ├── exceptions/ # 自定义异常类
│ │ ├── filters/ # 全局异常过滤器 (Exception Filters)
│ │ ├── guards/ # 全局守卫 (例如: 权限校验 JwtAuthGuard)
│ │ ├── interceptors/ # 全局拦截器 (例如: 统一响应格式、日志拦截)
│ │ ├── pipes/ # 全局管道 (例如: 数据验证、类型转换)
│ │ └── utils/ # 工具函数 (例如: 日期处理、加密解密)
│ │
│ ├── core/ # 核心模块目录 (仅在 AppModule 中导入一次)
│ │ ├── core.module.ts # 核心模块定义
│ │ ├── config/ # 配置管理 (如: TypeORM配置、Redis配置)
│ │ └── logger/ # 自定义全局日志模块
│ │
│ ├── database/ # 数据库相关 (非业务专属)
│ │ ├── migrations/ # 数据库迁移脚本
│ │ └── seeds/ # 数据库种子数据
│ │
│ ├── modules/ # 业务模块目录 (按业务领域划分)
│ │ ├── auth/ # 认证模块 (登录、注册、Token签发)
│ │ │
│ │ ├── users/ # 用户模块 (示例)
│ │ │ ├── dto/ # 数据传输对象 (入参验证)
│ │ │ │ ├── create-user.dto.ts
│ │ │ │ └── update-user.dto.ts
│ │ │ ├── entities/ # 实体类 (数据库表映射)
│ │ │ │ └── user.entity.ts
│ │ │ ├── interfaces/ # 接口定义 (TS 类型)
│ │ │ ├── users.controller.ts # 控制器 (处理路由和请求)
│ │ │ ├── users.service.ts # 服务类 (业务逻辑)
│ │ │ ├── users.module.ts # 模块组装
│ │ │ └── users.service.spec.ts # 单元测试
│ │ │
│ │ └── products/ # 其他业务模块...
│ │
│ ├── app.module.ts # 根模块 (挂载所有其他模块)
│ └── main.ts # 应用程序入口文件
│
├── test/ # e2e (端到端) 测试目录
│ ├── app.e2e-spec.ts
│ └── jest-e2e.json
│
├── .env.development # 开发环境变量
├── .env.production # 生产环境变量
├── nest-cli.json # Nest CLI 配置文件
├── package.json
├── tsconfig.json # TypeScript 编译配置
└── tsconfig.build.json
