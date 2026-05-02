import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(201)
  getUsers(): any {
    return this.userService.findAll();
  }

  @Get('/testHttpException')
  testHttpException(): any {
    throw new HttpException(
      {
        status: HttpStatus.FORBIDDEN,
        message: 'This is a custom message',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  @Post()
  addUser(@Body() user: User): any {
    return this.userService.create(user);
  }
}
