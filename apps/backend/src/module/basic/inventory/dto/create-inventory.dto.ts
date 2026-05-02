import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Length,
  IsDateString,
} from 'class-validator';

export class CreateInventoryDto {
  @IsString({ message: '仓号必须是字符串' })
  @IsNotEmpty({ message: '仓号不能为空' })
  @Length(1, 20, { message: '仓号长度必须在 1 到 20 之间' })
  warehouse_code: string;

  @IsString({ message: '货位号必须是字符串' })
  @IsNotEmpty({ message: '货位号不能为空' })
  @Length(1, 20, { message: '货位号长度必须在 1 到 20 之间' })
  location_code: string;

  @IsString({ message: '生产企业批准号必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '生产企业批准号长度不能超过 50' })
  manufacturerApprovalNo?: string;

  @IsString({ message: '药品批准号必须是字符串' })
  @IsNotEmpty({ message: '药品批准号不能为空' })
  @Length(1, 50, { message: '药品批准号长度必须在 1 到 50 之间' })
  drugApprovalNo: string;

  @IsString({ message: '药品名称必须是字符串' })
  @IsNotEmpty({ message: '药品名称不能为空' })
  @Length(1, 100, { message: '药品名称长度必须在 1 到 100 之间' })
  drug_name: string;

  @IsString({ message: '批号必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '批号长度不能超过 50' })
  batch_no?: string;

  @IsDateString({}, { message: '生产日期格式不正确' })
  @IsNotEmpty({ message: '生产日期不能为空' })
  production_date: string | Date;

  @IsDateString({}, { message: '有效截止日期格式不正确' })
  @IsNotEmpty({ message: '有效截止日期不能为空' })
  expiry_date: string | Date;

  @IsInt({ message: '库存数量必须是整数' })
  @IsNotEmpty({ message: '库存数量不能为空' })
  @Min(0, { message: '库存数量不能小于 0' })
  quantity: number;
}
