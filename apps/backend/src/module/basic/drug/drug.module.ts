import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drug } from '@/entity/Drug';
import { DrugController } from './drug.controller';
import { DrugService } from './drug.service';
@Module({
  imports: [TypeOrmModule.forFeature([Drug])],
  controllers: [DrugController],
  providers: [DrugService],
  exports: [DrugService],
})
export class DrugModule {}
