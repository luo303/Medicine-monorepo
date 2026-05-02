import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  Length,
  Min,
} from 'class-validator';

export class CreateSalesOutboundDto {
  @IsString({ message: '仓号必须是字符串' })
  @IsNotEmpty({ message: '仓号不能为空' })
  @Length(1, 20, { message: '仓号长度必须在 1 到 20 之间' })
  warehouse_code: string;

  @IsString({ message: '货位号必须是字符串' })
  @IsNotEmpty({ message: '货位号不能为空' })
  @Length(1, 20, { message: '货位号长度必须在 1 到 20 之间' })
  location_code: string;

  @IsString({ message: '销售单号必须是字符串' })
  @IsNotEmpty({ message: '销售单号不能为空' })
  @Length(1, 50, { message: '销售单号长度必须在 1 到 50 之间' })
  orderNo: string;

  @IsDateString({}, { message: '出库日期格式不正确' })
  @IsNotEmpty({ message: '出库日期不能为空' })
  outbound_date: string | Date;

  @IsString({ message: '机构批准号必须是字符串' })
  @IsNotEmpty({ message: '机构批准号不能为空' })
  @Length(1, 50, { message: '机构批准号长度必须在 1 到 50 之间' })
  institutionApprovalNo: string;

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

  @IsDateString({}, { message: '生产日期格式不正确' })
  @IsNotEmpty({ message: '生产日期不能为空' })
  production_date: string | Date;

  @IsInt({ message: '出库数量必须是整数' })
  @IsNotEmpty({ message: '出库数量不能为空' })
  @Min(1, { message: '出库数量不能小于 1' })
  quantity: number;

  @IsString({ message: '销售员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '销售员长度不能超过 50' })
  salesperson?: string;

  @IsString({ message: '检验员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '检验员长度不能超过 50' })
  inspector?: string;

  @IsString({ message: '保管员必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '保管员长度不能超过 50' })
  keeper?: string;
}

export class UpdateSalesOutboundDto {
  @IsInt({ message: '出库数量必须是整数' })
  @IsOptional()
  @Min(1, { message: '出库数量不能小于 1' })
  quantity?: number;
}
