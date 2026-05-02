import { Module } from '@nestjs/common';
import { MedicalInstitutionService } from './MedicalInstitution.service';
import { MedicalInstitutionController } from './MedicalInstitution.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalInstitution } from '@/entity/MedicalInstitution';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalInstitution])],
  providers: [MedicalInstitutionService],
  controllers: [MedicalInstitutionController],
})
export class MedicalInstitutionModule {}
