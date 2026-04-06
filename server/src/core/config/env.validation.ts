import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  BASE_URL: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(14).default(12),
  LLM_DEFAULT_PROVIDER: Joi.string()
    .valid('openai', 'anthropic', 'google', 'deepseek', 'ollama')
    .default('openai'),
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_MODEL: Joi.string().default('gpt-4.1-mini'),
  ANTHROPIC_API_KEY: Joi.string().optional(),
  ANTHROPIC_MODEL: Joi.string().default('claude-3-5-sonnet-latest'),
  GOOGLE_API_KEY: Joi.string().optional(),
  GOOGLE_MODEL: Joi.string().default('gemini-2.5-flash'),
  DEEPSEEK_API_KEY: Joi.string().optional(),
  DEEPSEEK_MODEL: Joi.string().default('deepseek-chat'),
  DEEPSEEK_BASE_URL: Joi.string().uri().default('https://api.deepseek.com/v1'),
  OLLAMA_BASE_URL: Joi.string().uri().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: Joi.string().default('qwen2.5:7b'),
});
