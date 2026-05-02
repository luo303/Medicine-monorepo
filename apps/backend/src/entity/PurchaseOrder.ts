// entity/PurchaseOrder.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Manufacturer } from './Manufacturer';
import { PurchaseDetail } from './PurchaseDetail';
import { PurchaseStorage } from './PurchaseStorage';

export enum PurchaseOrderStatus {
  PENDING = '待审核',
  APPROVED = '已审核',
  PARTIAL = '部分入库',
  COMPLETE = '全部入库',
  FINISHED = '已完成',
}

@Entity('purchase_order')
//采购订单主表
export class PurchaseOrder {
  @PrimaryColumn({ length: 50, comment: '采购单号' })
  order_no: string;

  @Column({ type: 'date', nullable: false, comment: '采购日期' })
  order_date: Date;

  @Column({ name: 'manufacturer_approval_no', length: 50, nullable: false })
  manufacturerApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '企业名称' })
  manufacturer_name: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: '总金额',
  })
  total_amount: number;

  @Column({ length: 50, nullable: true, comment: '采购员' })
  purchaser: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
    comment: '状态',
  })
  status: PurchaseOrderStatus;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  create_time: Date;

  // 关联关系
  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.purchaseOrders)
  @JoinColumn({ name: 'manufacturer_approval_no' })
  manufacturer: Manufacturer;

  @OneToMany(
    () => PurchaseDetail,
    (purchaseDetail) => purchaseDetail.purchaseOrder,
    { cascade: true },
  )
  purchaseDetails: PurchaseDetail[];

  @OneToMany(
    () => PurchaseStorage,
    (purchaseStorage) => purchaseStorage.purchaseOrder,
  )
  purchaseStorages: PurchaseStorage[];
}
