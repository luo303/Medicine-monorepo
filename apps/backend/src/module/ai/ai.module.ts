import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DrugModule } from '../basic/drug/drug.module';
import { WarehouseModule } from '../basic/warehouse/warehouse.module';
import { ManufacturerModule } from '../basic/manufacturer/manufacturer.module';
import { MedicalInstitutionModule } from '../basic/MedicalInstitution/MedicalInstitution.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from '@/entity/Inventory';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { SalesOrder } from '@/entity/SalesOrder';
import { StorageLocation } from '@/entity/StorageLocation';
import { InventoryModule } from '../basic/inventory/inventory.module';
import { StorageLocationModule } from '../basic/storage-location/storage-location.module';
import { PurchaseModule } from '../basic/purchase/purchase.module';
import { SalesModule } from '../basic/sales/sales.module';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
  imports: [
    DrugModule,
    WarehouseModule,
    ManufacturerModule,
    MedicalInstitutionModule,
    InventoryModule,
    StorageLocationModule,
    PurchaseModule,
    SalesModule,
    KnowledgeModule,
    TypeOrmModule.forFeature([
      Inventory,
      PurchaseOrder,
      SalesOrder,
      StorageLocation,
    ]),
  ],
})
export class AiModule {}
