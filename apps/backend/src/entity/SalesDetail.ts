// entity/SalesDetail.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesOrder } from './SalesOrder';
import { Manufacturer } from './Manufacturer';
import { Drug } from './Drug';

@Entity('sales_detail')
//销售订单明细表
export class SalesDetail {
  @PrimaryGeneratedColumn({ comment: '明细ID' })
  id: number;

  @Column({ name: 'order_no', length: 50, nullable: false })
  orderNo: string;

  @Column({ name: 'manufacturer_approval_no', length: 50, nullable: false })
  manufacturerApprovalNo: string;

  @Column({ name: 'drug_approval_no', length: 50, nullable: false })
  drugApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '药品名称' })
  drug_name: string;

  @Column({ type: 'date', nullable: false, comment: '生产日期' })
  production_date: Date;

  @Column({ type: 'int', nullable: false, comment: '销售数量' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: '销售单价',
  })
  unit_price: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    generatedType: 'STORED',
    asExpression: 'quantity * unit_price',
    comment: '销售金额',
  })
  amount: number;

  // 关联关系
  @ManyToOne(() => SalesOrder, (salesOrder) => salesOrder.salesDetails)
  @JoinColumn({ name: 'order_no' })
  salesOrder: SalesOrder;

  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.salesDetails)
  @JoinColumn({ name: 'manufacturer_approval_no' })
  manufacturer: Manufacturer;

  @ManyToOne(() => Drug, (drug) => drug.salesDetails)
  @JoinColumn({ name: 'drug_approval_no' })
  drug: Drug;
}
