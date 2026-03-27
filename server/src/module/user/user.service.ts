import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  findAll() {
    return 'This is a user service';
  }
}
