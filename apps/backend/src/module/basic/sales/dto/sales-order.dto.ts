import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { SalesOrderStatus } from '@/entity/SalesOrder';
import { CreateSalesOrderDetailDto } from './sales-detail.dto';

export class CreateSalesOrderDto {
  @IsString({ message: '销售单号必须是字符串' })
  @IsNotEmpty({ message: '销售单号不能为空' })
  @Length(1, 50, { message: '销售单号长度必须在 1 到 50 之间' })
  order_no: string;

  @IsDateString({}, { message: '销售日期格式不正确' })
  @IsNotEmpty({ message: '销售日期不能为空' })
  sales_date: string | Date;

  @IsString({ message: '医疗机构批准号必须是字符串' })
  @IsNotEmpty({ message: '医疗机构批准号不能为空' })
  @Length(1, 50, { message: '医疗机构批准号长度必须在 1 到 50 之间' })
  institutionApprovalNo: string;

  @IsString({ message: '医疗机构名称必须是字符串' })
  @IsNotEmpty({ message: '医疗机构名称不能为空' })
  @Length(1, 100, { message: '医疗机构名称长度必须在 1 到 100 之间' })
  institution_name: string;

  @IsNumber({}, { message: '总金额必须是数字' })
  @IsOptional()
  total_amount?: number;

  @IsString({ message: '销售员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '销售员长度不能超过 50' })
  salesperson?: string;

  @IsEnum(SalesOrderStatus, { message: '销售订单状态不合法' })
  @IsOptional()
  status?: SalesOrderStatus;

  @IsArray({ message: '销售明细必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一条销售明细' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderDetailDto)
  @IsOptional()
  salesDetails?: CreateSalesOrderDetailDto[];
}

export class UpdateSalesOrderDto {
  @IsDateString({}, { message: '销售日期格式不正确' })
  @IsOptional()
  sales_date?: string | Date;

  @IsString({ message: '医疗机构名称必须是字符串' })
  @IsOptional()
  @Length(1, 100, { message: '医疗机构名称长度必须在 1 到 100 之间' })
  institution_name?: string;

  @IsNumber({}, { message: '总金额必须是数字' })
  @IsOptional()
  total_amount?: number;

  @IsString({ message: '销售员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '销售员长度不能超过 50' })
  salesperson?: string;

  @IsEnum(SalesOrderStatus, { message: '销售订单状态不合法' })
  @IsOptional()
  status?: SalesOrderStatus;
}
