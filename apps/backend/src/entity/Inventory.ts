// entity/Inventory.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Drug } from './Drug';
import { Warehouse } from './Warehouse';

@Entity('inventory')
@Unique([
  'warehouse_code',
  'location_code',
  'drugApprovalNo',
  'batch_no',
  'production_date',
])
//库存表
export class Inventory {
  @PrimaryGeneratedColumn({ comment: '库存ID' })
  id: number;

  @Column({ length: 20, nullable: false, comment: '仓号' })
  warehouse_code: string;

  @Column({ length: 20, nullable: false, comment: '货位号' })
  location_code: string;

  @Column({ name: 'manufacturer_approval_no', length: 50, nullable: true })
  manufacturerApprovalNo: string;

  @Column({ name: 'drug_approval_no', length: 50, nullable: false })
  drugApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '药品名称' })
  drug_name: string;

  @Column({ length: 50, nullable: true, comment: '批号' })
  batch_no: string;

  @Column({ type: 'date', nullable: false, comment: '生产日期' })
  production_date: Date;

  @Column({ type: 'date', nullable: false, comment: '有效截止日期' })
  expiry_date: Date;

  @Column({ type: 'int', nullable: false, default: 0, comment: '库存数量' })
  quantity: number;

  @UpdateDateColumn({ name: 'last_update', comment: '最后更新时间' })
  last_update: Date;

  // 关联关系
  @ManyToOne(() => Drug, (drug) => drug.inventories)
  @JoinColumn({ name: 'drug_approval_no' })
  drug: Drug;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventories)
  @JoinColumn({ name: 'warehouse_code', referencedColumnName: 'code' })
  warehouse: Warehouse;
}
