import { Module } from '@nestjs/common';
import { StorageLocationService } from './storage-location.service';
import { StorageLocationController } from './storage-location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageLocation } from '@/entity/StorageLocation';

@Module({
  imports: [TypeOrmModule.forFeature([StorageLocation])],
  providers: [StorageLocationService],
  controllers: [StorageLocationController],
  exports: [StorageLocationService],
})
export class StorageLocationModule {}
