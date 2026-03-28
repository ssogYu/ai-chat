import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'demo@example.com',
    description: '已注册邮箱',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 8,
    description: '登录密码',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
