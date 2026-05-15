import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreateDrugDto {
  @Length(1, 50, { message: '药品批准号长度必须在 1 到 50 之间' })
  @IsString({ message: '药品批准号必须是字符串' })
  @IsNotEmpty({ message: '药品批准号不能为空' })
  approval_no: string;

  @Length(1, 100, { message: '药品名称长度必须在 1 到 100 之间' })
  @IsString({ message: '药品名称必须是字符串' })
  @IsNotEmpty({ message: '药品名称不能为空' })
  name: string;

  @IsOptional()
  @Length(0, 100, { message: '学名长度不能超过 100' })
  @IsString({ message: '学名必须是字符串' })
  scientific_name?: string;

  @IsOptional()
  @Length(0, 50, { message: '型号长度不能超过 50' })
  @IsString({ message: '型号必须是字符串' })
  model?: string;

  @IsOptional()
  @Length(0, 100, { message: '规格长度不能超过 100' })
  @IsString({ message: '规格必须是字符串' })
  specification?: string;

  @IsOptional()
  @IsBoolean({ message: '是否处方药必须是布尔值' })
  is_prescription?: boolean;
}
