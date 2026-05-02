// entity/SalesOutbound.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SalesOrder } from './SalesOrder';
import { MedicalInstitution } from './MedicalInstitution';
import { Drug } from './Drug';

@Entity('sales_outbound')
//销售订单出库表
export class SalesOutbound {
  @PrimaryGeneratedColumn({ comment: '出库记录ID' })
  id: number;

  @Column({ length: 20, nullable: false, comment: '仓号' })
  warehouse_code: string;

  @Column({ length: 20, nullable: false, comment: '货位号' })
  location_code: string;

  @Column({ name: 'order_no', length: 50, nullable: false })
  orderNo: string;

  @Column({ type: 'date', nullable: false, comment: '出库日期' })
  outbound_date: Date;

  @Column({ name: 'institution_approval_no', length: 50, nullable: false })
  institutionApprovalNo: string;

  @Column({ name: 'manufacturer_approval_no', length: 50, nullable: true })
  manufacturerApprovalNo: string;

  @Column({ name: 'drug_approval_no', length: 50, nullable: false })
  drugApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '药品名称' })
  drug_name: string;

  @Column({ type: 'date', nullable: false, comment: '生产日期' })
  production_date: Date;

  @Column({ type: 'int', nullable: false, comment: '出库数量' })
  quantity: number;

  @Column({ length: 50, nullable: true, comment: '销售员' })
  salesperson: string;

  @Column({ length: 50, nullable: true, comment: '检验员' })
  inspector: string;

  @Column({ length: 50, nullable: true, comment: '保管员' })
  keeper: string;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  create_time: Date;

  // 关联关系
  @ManyToOne(() => SalesOrder, (salesOrder) => salesOrder.salesOutbounds)
  @JoinColumn({ name: 'order_no' })
  salesOrder: SalesOrder;

  @ManyToOne(
    () => MedicalInstitution,
    (institution) => institution.salesOutbounds,
  )
  @JoinColumn({ name: 'institution_approval_no' })
  institution: MedicalInstitution;

  @ManyToOne(() => Drug, (drug) => drug.salesOutbounds)
  @JoinColumn({ name: 'drug_approval_no' })
  drug: Drug;
}
