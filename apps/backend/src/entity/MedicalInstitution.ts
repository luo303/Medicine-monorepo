// entity/MedicalInstitution.ts
import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { SalesOrder } from './SalesOrder';
import { SalesOutbound } from './SalesOutbound';

@Entity('medical_institution')
//医疗机构表
export class MedicalInstitution {
  @PrimaryColumn({ length: 50, comment: '机构批准号' })
  approval_no: string;

  @Column({ length: 100, nullable: false, comment: '机构名称' })
  name: string;

  @Column({ length: 200, nullable: true, comment: '地址' })
  address: string;

  @Column({ length: 20, nullable: true, comment: '邮政编码' })
  postal_code: string;

  @Column({ length: 50, nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'boolean', nullable: true, comment: '是否专科医院' })
  is_specialized: boolean;

  // 关联关系
  @OneToMany(() => SalesOrder, (salesOrder) => salesOrder.institution)
  salesOrders: SalesOrder[];

  @OneToMany(() => SalesOutbound, (salesOutbound) => salesOutbound.institution)
  salesOutbounds: SalesOutbound[];
}
