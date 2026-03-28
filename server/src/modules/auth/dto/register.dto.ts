import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'demo@example.com',
    description: '用户邮箱，作为唯一登录账号',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 8,
    maxLength: 64,
    description: '至少 8 位，需包含大小写字母和数字',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  password!: string;

  @ApiPropertyOptional({
    example: 'Demo User',
    maxLength: 50,
    description: '用户昵称，可选',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}
