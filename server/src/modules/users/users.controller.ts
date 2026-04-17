import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户资料' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: UserEntity })
  async getProfile(@CurrentUser() currentUser: AuthUser) {
    const user = await this.usersService.findById(currentUser.sub);
    return user ? this.usersService.toEntity(user) : null;
  }
}
