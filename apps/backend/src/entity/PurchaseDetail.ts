// entity/PurchaseDetail.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './PurchaseOrder';
import { Drug } from './Drug';

@Entity('purchase_detail')
//采购订单明细表
export class PurchaseDetail {
  @PrimaryGeneratedColumn({ comment: '明细ID' })
  id: number;

  @Column({ name: 'order_no', length: 50, nullable: false })
  orderNo: string;

  @Column({ name: 'drug_approval_no', length: 50, nullable: false })
  drugApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '药品名称' })
  drug_name: string;

  @Column({ type: 'date', nullable: false, comment: '生产日期' })
  production_date: Date;

  @Column({ type: 'int', nullable: false, comment: '有效期(月)' })
  validity_months: number;

  @Column({ type: 'int', nullable: false, comment: '采购数量' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: '采购单价',
  })
  unit_price: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    generatedType: 'STORED',
    asExpression: 'quantity * unit_price',
    comment: '采购金额',
  })
  amount: number;

  // 关联关系
  @ManyToOne(
    () => PurchaseOrder,
    (purchaseOrder) => purchaseOrder.purchaseDetails,
  )
  @JoinColumn({ name: 'order_no' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Drug, (drug) => drug.purchaseDetails)
  @JoinColumn({ name: 'drug_approval_no' })
  drug: Drug;
}
