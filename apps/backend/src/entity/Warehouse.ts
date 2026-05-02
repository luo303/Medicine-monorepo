// entity/Warehouse.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StorageLocation } from './StorageLocation';
import { Inventory } from './Inventory';

@Entity('warehouse')
//仓库表
export class Warehouse {
  @PrimaryGeneratedColumn({ comment: '仓库ID' })
  id: number;

  @Column({ length: 20, unique: true, nullable: false, comment: '仓号' })
  code: string;

  @Column({ length: 100, nullable: false, comment: '仓库名称' })
  name: string;

  @Column({ length: 200, nullable: true, comment: '仓库地址' })
  address: string;

  @Column({ length: 50, nullable: true, comment: '仓库管理员' })
  manager: string;

  // 关联关系
  @OneToMany(
    () => StorageLocation,
    (storageLocation) => storageLocation.warehouse,
  )
  storageLocations: StorageLocation[];

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventories: Inventory[];
}
