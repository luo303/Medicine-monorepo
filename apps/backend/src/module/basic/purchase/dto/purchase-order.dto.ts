import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Length,
} from 'class-validator';
import { PurchaseOrderStatus } from '@/entity/PurchaseOrder';

export class CreatePurchaseOrderDto {
  @IsString({ message: '采购单号必须是字符串' })
  @IsNotEmpty({ message: '采购单号不能为空' })
  @Length(1, 50, { message: '采购单号长度必须在 1 到 50 之间' })
  order_no: string;

  @IsDateString({}, { message: '采购日期格式不正确' })
  @IsNotEmpty({ message: '采购日期不能为空' })
  order_date: string | Date;

  @IsString({ message: '生产企业批准号必须是字符串' })
  @IsNotEmpty({ message: '生产企业批准号不能为空' })
  @Length(1, 50, { message: '生产企业批准号长度必须在 1 到 50 之间' })
  manufacturerApprovalNo: string;

  @IsString({ message: '企业名称必须是字符串' })
  @IsNotEmpty({ message: '企业名称不能为空' })
  @Length(1, 100, { message: '企业名称长度必须在 1 到 100 之间' })
  manufacturer_name: string;

  @IsNumber({}, { message: '总金额必须是数字' })
  @IsOptional()
  total_amount?: number;

  @IsString({ message: '采购员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '采购员长度不能超过 50' })
  purchaser?: string;

  @IsEnum(PurchaseOrderStatus, { message: '无效的订单状态' })
  @IsOptional()
  status?: PurchaseOrderStatus;
}

export class UpdatePurchaseOrderDto {
  @IsDateString({}, { message: '采购日期格式不正确' })
  @IsOptional()
  order_date?: string | Date;

  @IsString({ message: '企业名称必须是字符串' })
  @IsOptional()
  @Length(1, 100, { message: '企业名称长度必须在 1 到 100 之间' })
  manufacturer_name?: string;

  @IsNumber({}, { message: '总金额必须是数字' })
  @IsOptional()
  total_amount?: number;

  @IsString({ message: '采购员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '采购员长度不能超过 50' })
  purchaser?: string;

  @IsEnum(PurchaseOrderStatus, { message: '无效的订单状态' })
  @IsOptional()
  status?: PurchaseOrderStatus;
}
