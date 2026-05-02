import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { PurchaseOrder } from './PurchaseOrder';
import { PurchaseStorage } from './PurchaseStorage';
import { SalesDetail } from './SalesDetail';

@Entity('manufacturer')
//生产企业表
export class Manufacturer {
  @PrimaryColumn({ length: 50, comment: '企业批准号' })
  approval_no: string;

  @Column({ length: 100, nullable: false, comment: '企业名称' })
  name: string;

  @Column({ length: 50, nullable: true, comment: '所在城市' })
  city: string;

  @Column({ length: 200, nullable: true, comment: '地址' })
  address: string;

  @Column({ length: 20, nullable: true, comment: '邮政编码' })
  postal_code: string;

  @Column({ length: 50, nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'boolean', nullable: true, comment: '是否GMP认证' })
  is_gmp: boolean;

  // 关联关系
  @OneToMany(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.manufacturer)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(
    () => PurchaseStorage,
    (purchaseStorage) => purchaseStorage.manufacturer,
  )
  purchaseStorages: PurchaseStorage[];

  @OneToMany(() => SalesDetail, (salesDetail) => salesDetail.manufacturer)
  salesDetails: SalesDetail[];
}
