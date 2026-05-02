import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { PurchaseDetail } from '@/entity/PurchaseDetail';
import { PurchaseStorage } from '@/entity/PurchaseStorage';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseDetail, PurchaseStorage]),
  ],
  providers: [PurchaseService],
  controllers: [PurchaseController],
  exports: [PurchaseService],
})
export class PurchaseModule {}
