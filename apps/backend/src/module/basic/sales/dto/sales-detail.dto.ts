import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateSalesDetailDto {
  @Length(1, 50, { message: '销售单号长度必须在 1 到 50 之间' })
  @IsString({ message: '销售单号必须是字符串' })
  @IsNotEmpty({ message: '销售单号不能为空' })
  orderNo: string;

  @Length(1, 50, { message: '生产企业批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '生产企业批准号必须是字符串' })
  @IsNotEmpty({ message: '生产企业批准号不能为空' })
  manufacturerApprovalNo: string;

  @Length(1, 50, { message: '药品批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '药品批准号必须是字符串' })
  @IsNotEmpty({ message: '药品批准号不能为空' })
  drugApprovalNo: string;

  @Length(1, 100, { message: '药品名称长度必须在 1 到 100 之间' })
  @IsString({ message: '药品名称必须是字符串' })
  @IsNotEmpty({ message: '药品名称不能为空' })
  drug_name: string;

  @IsDateString({}, { message: '生产日期格式不正确' })
  @IsNotEmpty({ message: '生产日期不能为空' })
  production_date: string | Date;

  @Min(1, { message: '销售数量不能小于 1' })
  @IsInt({ message: '销售数量必须是整数' })
  @IsNotEmpty({ message: '销售数量不能为空' })
  quantity: number;

  @Min(0, { message: '销售单价不能小于 0' })
  @IsNumber({}, { message: '销售单价必须是数字' })
  @IsNotEmpty({ message: '销售单价不能为空' })
  unit_price: number;
}

export class CreateSalesOrderDetailDto {
  @Length(1, 50, { message: '生产企业批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '生产企业批准号必须是字符串' })
  @IsNotEmpty({ message: '生产企业批准号不能为空' })
  manufacturerApprovalNo: string;

  @Length(1, 50, { message: '药品批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '药品批准号必须是字符串' })
  @IsNotEmpty({ message: '药品批准号不能为空' })
  drugApprovalNo: string;

  @Length(1, 100, { message: '药品名称长度必须在 1 到 100 之间' })
  @IsString({ message: '药品名称必须是字符串' })
  @IsNotEmpty({ message: '药品名称不能为空' })
  drug_name: string;

  @IsDateString({}, { message: '生产日期格式不正确' })
  @IsNotEmpty({ message: '生产日期不能为空' })
  production_date: string | Date;

  @Min(1, { message: '销售数量不能小于 1' })
  @IsInt({ message: '销售数量必须是整数' })
  @IsNotEmpty({ message: '销售数量不能为空' })
  quantity: number;

  @Min(0, { message: '销售单价不能小于 0' })
  @IsNumber({}, { message: '销售单价必须是数字' })
  @IsNotEmpty({ message: '销售单价不能为空' })
  unit_price: number;
}

export class UpdateSalesDetailDto {
  @IsOptional()
  @Min(1, { message: '销售数量不能小于 1' })
  @IsInt({ message: '销售数量必须是整数' })
  quantity?: number;

  @IsOptional()
  @Min(0, { message: '销售单价不能小于 0' })
  @IsNumber({}, { message: '销售单价必须是数字' })
  unit_price?: number;
}
