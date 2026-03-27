import * as Joi from 'joi';
export const validationSchema = Joi.object({
  // 应用配置
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  BASE_URL: Joi.string().uri().required(),
});
