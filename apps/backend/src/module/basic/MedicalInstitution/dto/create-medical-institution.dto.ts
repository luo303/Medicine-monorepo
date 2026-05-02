import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreateMedicalInstitutionDto {
  @IsString({ message: '机构批准号必须是字符串' })
  @IsNotEmpty({ message: '机构批准号不能为空' })
  @Length(1, 50, { message: '机构批准号长度必须在 1 到 50 之间' })
  approval_no: string;

  @IsString({ message: '机构名称必须是字符串' })
  @IsNotEmpty({ message: '机构名称不能为空' })
  @Length(1, 100, { message: '机构名称长度必须在 1 到 100 之间' })
  name: string;

  @IsString({ message: '地址必须是字符串' })
  @IsOptional()
  @Length(0, 200, { message: '地址长度不能超过 200' })
  address?: string;

  @IsString({ message: '邮政编码必须是字符串' })
  @IsOptional()
  @Length(0, 20, { message: '邮政编码长度不能超过 20' })
  postal_code?: string;

  @IsString({ message: '联系电话必须是字符串' })
  @IsOptional()
  @Length(0, 50, { message: '联系电话长度不能超过 50' })
  phone?: string;

  @IsBoolean({ message: '是否专科医院必须是布尔值' })
  @IsOptional()
  is_specialized?: boolean;
}
