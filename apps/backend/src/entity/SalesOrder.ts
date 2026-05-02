// entity/SalesOrder.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MedicalInstitution } from './MedicalInstitution';
import { SalesDetail } from './SalesDetail';
import { SalesOutbound } from './SalesOutbound';

export enum SalesOrderStatus {
  PENDING = '待审核',
  APPROVED = '已审核',
  PARTIAL = '部分出库',
  COMPLETE = '全部出库',
  FINISHED = '已完成',
}

@Entity('sales_order')
//销售订单主表
export class SalesOrder {
  @PrimaryColumn({ length: 50, comment: '销售单号' })
  order_no: string;

  @Column({ type: 'date', nullable: false, comment: '销售日期' })
  sales_date: Date;

  @Column({ name: 'institution_approval_no', length: 50, nullable: false })
  institutionApprovalNo: string;

  @Column({ length: 100, nullable: false, comment: '机构名称' })
  institution_name: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: '总金额',
  })
  total_amount: number;

  @Column({ length: 50, nullable: true, comment: '销售员' })
  salesperson: string;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.PENDING,
    comment: '状态',
  })
  status: SalesOrderStatus;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  create_time: Date;

  // 关联关系
  @ManyToOne(() => MedicalInstitution, (institution) => institution.salesOrders)
  @JoinColumn({ name: 'institution_approval_no' })
  institution: MedicalInstitution;

  @OneToMany(() => SalesDetail, (salesDetail) => salesDetail.salesOrder, {
    cascade: true,
  })
  salesDetails: SalesDetail[];

  @OneToMany(() => SalesOutbound, (salesOutbound) => salesOutbound.salesOrder)
  salesOutbounds: SalesOutbound[];
}
