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
  @Length(1, 20, { message: '仓号长度必须在 1 到 20 之间' })
  @IsString({ message: '仓号必须是字符串' })
  @IsNotEmpty({ message: '仓号不能为空' })
  warehouse_code: string;

  @Length(1, 20, { message: '货位号长度必须在 1 到 20 之间' })
  @IsString({ message: '货位号必须是字符串' })
  @IsNotEmpty({ message: '货位号不能为空' })
  location_code: string;

  @Length(1, 50, { message: '销售单号长度必须在 1 到 50 之间' })
  @IsString({ message: '销售单号必须是字符串' })
  @IsNotEmpty({ message: '销售单号不能为空' })
  orderNo: string;

  @IsDateString({}, { message: '出库日期格式不正确' })
  @IsNotEmpty({ message: '出库日期不能为空' })
  outbound_date: string | Date;

  @Length(1, 50, { message: '机构批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '机构批准号必须是字符串' })
  @IsNotEmpty({ message: '机构批准号不能为空' })
  institutionApprovalNo: string;

  @IsOptional()
  @Length(0, 50, { message: '生产企业批准号长度不能超过 50' })
  @IsString({ message: '生产企业批准号必须是字符串' })
  manufacturerApprovalNo?: string;

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

  @Min(1, { message: '出库数量不能小于 1' })
  @IsInt({ message: '出库数量必须是整数' })
  @IsNotEmpty({ message: '出库数量不能为空' })
  quantity: number;

  @IsOptional()
  @Length(0, 50, { message: '销售员长度不能超过 50' })
  @IsString({ message: '销售员必须是字符串' })
  salesperson?: string;

  @Length(1, 50, { message: '检验员长度必须在 1 到 50 之间' })
  @IsString({ message: '检验员必须是字符串' })
  @IsNotEmpty({ message: '检验员不能为空' })
  inspector: string;

  @Length(1, 50, { message: '保管员长度必须在 1 到 50 之间' })
  @IsString({ message: '保管员必须是字符串' })
  @IsNotEmpty({ message: '保管员不能为空' })
  keeper: string;
}

export class UpdateSalesOutboundDto {
  @IsOptional()
  @Min(1, { message: '出库数量不能小于 1' })
  @IsInt({ message: '出库数量必须是整数' })
  quantity?: number;
}
