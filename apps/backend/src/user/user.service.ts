import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from './user.entity';
import { DeepPartial, Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    const users = await this.userRepository.find();
    return users;
  }
  async findOne(username: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        username,
      },
    });
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    } else if (user.password !== password) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Password not match',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
  async create(user: DeepPartial<User>) {
    const userTmp = this.userRepository.create(user);
    const result = await this.userRepository.save(userTmp);
    return result;
  }
  async update(id: number, user: Partial<User>) {
    const result = await this.userRepository.update(id, user);
    if (!result.affected) {
      throw new NotFoundException('用户不存在，更新失败');
    }
    return result;
  }
  async remove(id: number) {
    const result = await this.userRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('用户不存在，删除失败');
    }
    return result;
  }
}
