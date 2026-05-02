// entity/StorageLocation.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Warehouse } from './Warehouse';

@Entity('storage_location')
@Unique(['warehouse', 'code'])
//货位表
export class StorageLocation {
  @PrimaryGeneratedColumn({ comment: '货位ID' })
  id: number;

  @Column({ name: 'warehouse_id', nullable: false })
  warehouseId: number;

  @Column({ length: 20, nullable: false, comment: '货位号' })
  code: string;

  @Column({ type: 'int', nullable: true, comment: '容量' })
  capacity: number;

  @Column({ length: 200, nullable: true, comment: '描述' })
  description: string;

  // 关联关系
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.storageLocations)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;
}
