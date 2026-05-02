import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import { SignDto } from './dto/sign.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<{ token: string }> {
    console.log(username, pass);
    try {
      const user = await this.usersService.findOne(username, pass);
      if (!user) {
        console.log('用户不存在');
        throw new HttpException('用户不存在', 400);
      }
      const payload = { sub: user.id, username: user.username };
      const token = await this.jwtService.signAsync(payload);
      return {
        token,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('登录失败，请检查用户名和密码', 400);
    }
  }
  async signUp(signUpDto: SignDto) {
    try {
      await this.usersService.create(signUpDto);
      return {
        message: '注册成功',
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('注册失败，请检查用户名和密码', 200);
    }
  }

  isAuthenticated() {
    return {
      data: null,
      message: '用户已认证',
    };
  }
}
