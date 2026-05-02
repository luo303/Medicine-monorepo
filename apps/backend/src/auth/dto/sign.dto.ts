import { IsNotEmpty, IsString, Length } from 'class-validator';
export class SignDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 10, { message: '用户名长度必须在3到10之间' })
  username: string;
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @Length(6, 12, { message: '密码长度必须在6到12之间' })
  password: string;
}
