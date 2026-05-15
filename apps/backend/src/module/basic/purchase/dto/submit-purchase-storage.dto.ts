import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitPurchaseStorageEntryDto {
  @Min(1, { message: '采购明细 ID 必须大于 0' })
  @IsInt({ message: '采购明细 ID 必须是整数' })
  @IsNotEmpty({ message: '采购明细 ID 不能为空' })
  detailId: number;

  @Length(1, 20, { message: '仓号长度必须在 1 到 20 之间' })
  @IsString({ message: '仓号必须是字符串' })
  @IsNotEmpty({ message: '仓号不能为空' })
  warehouse_code: string;

  @Length(1, 20, { message: '货位号长度必须在 1 到 20 之间' })
  @IsString({ message: '货位号必须是字符串' })
  @IsNotEmpty({ message: '货位号不能为空' })
  location_code: string;

  @Min(1, { message: '入库数量不能小于 1' })
  @IsInt({ message: '入库数量必须是整数' })
  @IsNotEmpty({ message: '入库数量不能为空' })
  quantity: number;

  @IsOptional()
  @Length(0, 50, { message: '批号长度不能超过 50' })
  @IsString({ message: '批号必须是字符串' })
  batch_no?: string;
}

export class SubmitPurchaseStorageDto {
  @Length(1, 50, { message: '采购单号长度必须在 1 到 50 之间' })
  @IsString({ message: '采购单号必须是字符串' })
  @IsNotEmpty({ message: '采购单号不能为空' })
  orderNo: string;

  @IsDateString({}, { message: '入库日期格式不正确' })
  @IsNotEmpty({ message: '入库日期不能为空' })
  storage_date: string | Date;

  @Length(1, 50, { message: '检验员长度必须在 1 到 50 之间' })
  @IsString({ message: '检验员必须是字符串' })
  @IsNotEmpty({ message: '检验员不能为空' })
  inspector: string;

  @Length(1, 50, { message: '保管员长度必须在 1 到 50 之间' })
  @IsString({ message: '保管员必须是字符串' })
  @IsNotEmpty({ message: '保管员不能为空' })
  keeper: string;

  @ArrayMinSize(1, { message: '至少需要一条入库明细' })
  @IsArray({ message: '入库明细必须是数组' })
  @IsNotEmpty({ message: '入库明细不能为空' })
  @ValidateNested({ each: true })
  @Type(() => SubmitPurchaseStorageEntryDto)
  entries: SubmitPurchaseStorageEntryDto[];
}
