// entity/Drug.ts
import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { PurchaseDetail } from './PurchaseDetail';
import { PurchaseStorage } from './PurchaseStorage';
import { SalesDetail } from './SalesDetail';
import { SalesOutbound } from './SalesOutbound';
import { Inventory } from './Inventory';

@Entity('drug')
//药品目录表
export class Drug {
  @PrimaryColumn({ length: 50, comment: '药品批准号' })
  approval_no: string;

  @Column({ length: 100, nullable: false, comment: '药品名称' })
  name: string;

  @Column({ length: 100, nullable: true, comment: '学名' })
  scientific_name: string;

  @Column({ length: 50, nullable: true, comment: '型号' })
  model: string;

  @Column({ length: 100, nullable: true, comment: '规格' })
  specification: string;

  @Column({ type: 'boolean', nullable: true, comment: '是否处方药' })
  is_prescription: boolean;

  // 关联关系
  @OneToMany(() => PurchaseDetail, (purchaseDetail) => purchaseDetail.drug)
  purchaseDetails: PurchaseDetail[];

  @OneToMany(() => PurchaseStorage, (purchaseStorage) => purchaseStorage.drug)
  purchaseStorages: PurchaseStorage[];

  @OneToMany(() => SalesDetail, (salesDetail) => salesDetail.drug)
  salesDetails: SalesDetail[];

  @OneToMany(() => SalesOutbound, (salesOutbound) => salesOutbound.drug)
  salesOutbounds: SalesOutbound[];

  @OneToMany(() => Inventory, (inventory) => inventory.drug)
  inventories: Inventory[];
}
