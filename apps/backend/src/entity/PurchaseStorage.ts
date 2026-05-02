// entity/PurchaseStorage.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PurchaseOrder } from './PurchaseOrder';
import { Manufacturer } from './Manufacturer';
import { Drug } from './Drug';

@Entity('purchase_storage')
//采购订单入库表
export class PurchaseStorage {
  @PrimaryGeneratedColumn({ comment: '入库记录ID' })
  id: number;

  @Column({ length: 20, nullable: false, comment: '仓号' })
  warehouse_code: string;

  @Column({ length: 20, nullable: false, comment: '货位号' })
  location_code: string;

  @Column({ name: 'order_no', length: 50, nullable: false })
  orderNo: string;

  @Column({ type: 'date', nullable: false, comment: '入库日期' })
  storage_date: Date;

  @Column({ name: 'manufacturer_approval_no', length: 50, nullable: false })
  manufacturerApprovalNo: string;

  @Column({ name: 'drug_approval_no', length: 50, nullable: false })
  drugApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '药品名称' })
  drug_name: string;

  @Column({ type: 'date', nullable: false, comment: '生产日期' })
  production_date: Date;

  @Column({ type: 'date', nullable: false, comment: '有效截止日期' })
  expiry_date: Date;

  @Column({ type: 'int', nullable: false, comment: '入库数量' })
  quantity: number;

  @Column({ length: 50, nullable: true, comment: '采购员' })
  purchaser: string;

  @Column({ length: 50, nullable: true, comment: '检验员' })
  inspector: string;

  @Column({ length: 50, nullable: true, comment: '保管员' })
  keeper: string;

  @Column({ length: 50, nullable: true, comment: '批号' })
  batch_no: string;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  create_time: Date;

  // 关联关系
  @ManyToOne(
    () => PurchaseOrder,
    (purchaseOrder) => purchaseOrder.purchaseStorages,
  )
  @JoinColumn({ name: 'order_no' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(
    () => Manufacturer,
    (manufacturer) => manufacturer.purchaseStorages,
  )
  @JoinColumn({ name: 'manufacturer_approval_no' })
  manufacturer: Manufacturer;

  @ManyToOne(() => Drug, (drug) => drug.purchaseStorages)
  @JoinColumn({ name: 'drug_approval_no' })
  drug: Drug;
}
