import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '@/entity/SalesOrder';
import { SalesDetail } from '@/entity/SalesDetail';
import { SalesOutbound } from '@/entity/SalesOutbound';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder, SalesDetail, SalesOutbound])],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [SalesService],
})
export class SalesModule {}
