import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Length,
} from 'class-validator';

export class CreateStorageLocationDto {
  @IsInt({ message: '仓库 ID 必须是整数' })
  @IsNotEmpty({ message: '仓库 ID 不能为空' })
  warehouseId: number;

  @IsString({ message: '货位号必须是字符串' })
  @IsNotEmpty({ message: '货位号不能为空' })
  @Length(1, 20, { message: '货位号长度必须在 1 到 20 之间' })
  code: string;

  @IsInt({ message: '容量必须是整数' })
  @IsOptional()
  @Min(0, { message: '容量不能小于 0' })
  capacity?: number;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  @Length(0, 200, { message: '描述长度不能超过 200' })
  description?: string;
}
