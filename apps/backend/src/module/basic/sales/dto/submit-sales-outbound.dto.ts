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

export class SubmitSalesOutboundEntryDto {
  @IsInt({ message: '销售明细 ID 必须是整数' })
  @Min(1, { message: '销售明细 ID 必须大于 0' })
  detailId: number;

  @IsInt({ message: '库存 ID 必须是整数' })
  @Min(1, { message: '库存 ID 必须大于 0' })
  inventoryId: number;

  @IsInt({ message: '出库数量必须是整数' })
  @Min(1, { message: '出库数量不能小于 1' })
  quantity: number;
}

export class SubmitSalesOutboundDto {
  @IsString({ message: '销售单号必须是字符串' })
  @IsNotEmpty({ message: '销售单号不能为空' })
  @Length(1, 50, { message: '销售单号长度必须在 1 到 50 之间' })
  orderNo: string;

  @IsDateString({}, { message: '出库日期格式不正确' })
  @IsNotEmpty({ message: '出库日期不能为空' })
  outbound_date: string | Date;

  @IsString({ message: '检验员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '检验员长度不能超过 50' })
  inspector?: string;

  @IsString({ message: '保管员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '保管员长度不能超过 50' })
  keeper?: string;

  @IsArray({ message: '出库明细必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一条出库明细' })
  @ValidateNested({ each: true })
  @Type(() => SubmitSalesOutboundEntryDto)
  entries: SubmitSalesOutboundEntryDto[];
}
