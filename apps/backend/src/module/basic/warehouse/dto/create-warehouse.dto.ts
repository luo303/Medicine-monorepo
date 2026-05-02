import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateWarehouseDto {
  @IsString({ message: '仓号必须是字符串' })
  @IsNotEmpty({ message: '仓号不能为空' })
  @Length(1, 20, { message: '仓号长度必须在 1 到 20 之间' })
  code: string;

  @IsString({ message: '仓库名称必须是字符串' })
  @IsNotEmpty({ message: '仓库名称不能为空' })
  @Length(1, 100, { message: '仓库名称长度必须在 1 到 100 之间' })
  name: string;

  @IsString({ message: '仓库地址必须是字符串' })
  @IsOptional()
  @Length(0, 200, { message: '仓库地址长度不能超过 200' })
  address?: string;

  @IsString({ message: '仓库管理员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '仓库管理员长度不能超过 50' })
  manager?: string;
}
