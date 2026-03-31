import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;
}

export class AuthResponseDto {
  @ApiProperty({
    type: UserEntity,
  })
  user!: UserEntity;

  @ApiProperty({
    type: AuthTokensDto,
  })
  tokens!: AuthTokensDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: true;
}
