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

export class CreatePurchaseDetailDto {
  @Length(1, 50, { message: '采购单号长度必须在 1 到 50 之间' })
  @IsString({ message: '采购单号必须是字符串' })
  @IsNotEmpty({ message: '采购单号不能为空' })
  orderNo: string;

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

  @Min(1, { message: '有效期不能小于 1' })
  @IsInt({ message: '有效期必须是整数' })
  @IsNotEmpty({ message: '有效期不能为空' })
  validity_months: number;

  @Min(1, { message: '采购数量不能小于 1' })
  @IsInt({ message: '采购数量必须是整数' })
  @IsNotEmpty({ message: '采购数量不能为空' })
  quantity: number;

  @Min(0, { message: '采购单价不能小于 0' })
  @IsNumber({}, { message: '采购单价必须是数字' })
  @IsNotEmpty({ message: '采购单价不能为空' })
  unit_price: number;
}

export class CreatePurchaseOrderDetailDto {
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

  @Min(1, { message: '有效期不能小于 1' })
  @IsInt({ message: '有效期必须是整数' })
  @IsNotEmpty({ message: '有效期不能为空' })
  validity_months: number;

  @Min(1, { message: '采购数量不能小于 1' })
  @IsInt({ message: '采购数量必须是整数' })
  @IsNotEmpty({ message: '采购数量不能为空' })
  quantity: number;

  @Min(0, { message: '采购单价不能小于 0' })
  @IsNumber({}, { message: '采购单价必须是数字' })
  @IsNotEmpty({ message: '采购单价不能为空' })
  unit_price: number;
}

export class UpdatePurchaseDetailDto {
  @IsOptional()
  @Min(1, { message: '采购数量不能小于 1' })
  @IsInt({ message: '采购数量必须是整数' })
  quantity?: number;

  @IsOptional()
  @Min(0, { message: '采购单价不能小于 0' })
  @IsNumber({}, { message: '采购单价必须是数字' })
  unit_price?: number;
}
