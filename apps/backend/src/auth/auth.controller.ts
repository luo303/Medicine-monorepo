import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../custom/Public';
import { SignDto } from './dto/sign.dto';
import type { Response } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async signIn(
    @Body() signInDto: SignDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(signInDto);

    const result = await this.authService.signIn(
      signInDto.username,
      signInDto.password,
    );
    console.log(result);
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 70,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return {
      code: 200,
      data: null,
      message: '登录成功',
    };
  }
  @Public()
  @HttpCode(201)
  @Post('/register')
  async signUp(@Body() signUpDto: SignDto) {
    console.log(signUpDto);
    const result = await this.authService.signUp(signUpDto);
    console.log(result);
    return {
      data: result,
      message: '注册成功',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/isAuthenticated')
  //直接借助guard判断是否认证
  isAuthenticated() {
    const result = this.authService.isAuthenticated();
    return result;
  }
}
