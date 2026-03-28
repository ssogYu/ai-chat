import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({
    example: 'cmn8wdb2n0000icxe06e2wzhg',
  })
  id!: string;

  @ApiProperty({
    example: 'demo@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    example: 'Demo User',
    nullable: true,
  })
  name!: string | null;

  @ApiPropertyOptional({
    example: '2026-03-27T12:48:21.839Z',
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({
    example: '2026-03-27T12:48:21.839Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-03-27T12:48:22.508Z',
  })
  updatedAt!: Date;
}
