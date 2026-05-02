import { Module } from '@nestjs/common';
import { ManufacturerModule } from './manufacturer/manufacturer.module';
import { MedicalInstitutionModule } from './MedicalInstitution/MedicalInstitution.module';
import { DrugModule } from './drug/drug.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { StorageLocationModule } from './storage-location/storage-location.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchaseModule } from './purchase/purchase.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ManufacturerModule,
    MedicalInstitutionModule,
    DrugModule,
    WarehouseModule,
    StorageLocationModule,
    InventoryModule,
    PurchaseModule,
    SalesModule,
  ],
})
export class BasicModule {}
