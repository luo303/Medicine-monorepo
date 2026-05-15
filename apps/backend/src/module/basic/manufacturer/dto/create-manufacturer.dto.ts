import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreateManufacturerDto {
  @Length(1, 50, { message: '企业批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '企业批准号必须是字符串' })
  @IsNotEmpty({ message: '企业批准号不能为空' })
  approval_no: string;

  @Length(1, 100, { message: '企业名称长度必须在 1 到 100 之间' })
  @IsString({ message: '企业名称必须是字符串' })
  @IsNotEmpty({ message: '企业名称不能为空' })
  name: string;

  @IsOptional()
  @Length(0, 50, { message: '所在城市长度不能超过 50' })
  @IsString({ message: '所在城市必须是字符串' })
  city?: string;

  @IsOptional()
  @Length(0, 200, { message: '地址长度不能超过 200' })
  @IsString({ message: '地址必须是字符串' })
  address?: string;

  @IsOptional()
  @Length(0, 20, { message: '邮政编码长度不能超过 20' })
  @IsString({ message: '邮政编码必须是字符串' })
  postal_code?: string;

  @IsOptional()
  @Length(0, 50, { message: '联系电话长度不能超过 50' })
  @IsString({ message: '联系电话必须是字符串' })
  phone?: string;

  @IsOptional()
  @IsBoolean({ message: '是否GMP认证必须是布尔值' })
  is_gmp?: boolean;
}
