import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1780303641242 implements MigrationInterface {
  name = 'Init1780303641242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`purchase_storage\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '入库记录ID', \`warehouse_code\` varchar(20) NOT NULL COMMENT '仓号', \`location_code\` varchar(20) NOT NULL COMMENT '货位号', \`order_no\` varchar(50) NOT NULL, \`storage_date\` date NOT NULL COMMENT '入库日期', \`manufacturer_approval_no\` varchar(50) NOT NULL, \`drug_approval_no\` varchar(50) NOT NULL, \`drug_name\` varchar(100) NOT NULL COMMENT '药品名称', \`production_date\` date NOT NULL COMMENT '生产日期', \`expiry_date\` date NOT NULL COMMENT '有效截止日期', \`quantity\` int NOT NULL COMMENT '入库数量', \`purchaser\` varchar(50) NULL COMMENT '采购员', \`inspector\` varchar(50) NULL COMMENT '检验员', \`keeper\` varchar(50) NULL COMMENT '保管员', \`batch_no\` varchar(50) NULL COMMENT '批号', \`create_time\` datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sales_outbound\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '出库记录ID', \`warehouse_code\` varchar(20) NOT NULL COMMENT '仓号', \`location_code\` varchar(20) NOT NULL COMMENT '货位号', \`order_no\` varchar(50) NOT NULL, \`outbound_date\` date NOT NULL COMMENT '出库日期', \`institution_approval_no\` varchar(50) NOT NULL, \`manufacturer_approval_no\` varchar(50) NULL, \`drug_approval_no\` varchar(50) NOT NULL, \`drug_name\` varchar(100) NOT NULL COMMENT '药品名称', \`production_date\` date NOT NULL COMMENT '生产日期', \`quantity\` int NOT NULL COMMENT '出库数量', \`salesperson\` varchar(50) NULL COMMENT '销售员', \`inspector\` varchar(50) NULL COMMENT '检验员', \`keeper\` varchar(50) NULL COMMENT '保管员', \`create_time\` datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`medical_institution\` (\`approval_no\` varchar(50) NOT NULL COMMENT '机构批准号', \`name\` varchar(100) NOT NULL COMMENT '机构名称', \`address\` varchar(200) NULL COMMENT '地址', \`postal_code\` varchar(20) NULL COMMENT '邮政编码', \`phone\` varchar(50) NULL COMMENT '联系电话', \`is_specialized\` tinyint NULL COMMENT '是否专科医院', PRIMARY KEY (\`approval_no\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sales_order\` (\`order_no\` varchar(50) NOT NULL COMMENT '销售单号', \`sales_date\` date NOT NULL COMMENT '销售日期', \`institution_approval_no\` varchar(50) NOT NULL, \`institution_name\` varchar(100) NOT NULL COMMENT '机构名称', \`total_amount\` decimal(12,2) NULL COMMENT '总金额', \`salesperson\` varchar(50) NULL COMMENT '销售员', \`status\` enum ('待审核', '已审核', '部分出库', '全部出库', '已完成') NOT NULL COMMENT '状态' DEFAULT '待审核', \`create_time\` datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`order_no\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sales_detail\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '明细ID', \`order_no\` varchar(50) NOT NULL, \`manufacturer_approval_no\` varchar(50) NOT NULL, \`drug_approval_no\` varchar(50) NOT NULL, \`drug_name\` varchar(100) NOT NULL COMMENT '药品名称', \`production_date\` date NOT NULL COMMENT '生产日期', \`quantity\` int NOT NULL COMMENT '销售数量', \`unit_price\` decimal(10,2) NOT NULL COMMENT '销售单价', \`amount\` decimal(12,2) AS (quantity * unit_price) STORED NOT NULL COMMENT '销售金额', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `INSERT INTO \`medicine\`.\`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        'medicine',
        'sales_detail',
        'GENERATED_COLUMN',
        'amount',
        'quantity * unit_price',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE \`manufacturer\` (\`approval_no\` varchar(50) NOT NULL COMMENT '企业批准号', \`name\` varchar(100) NOT NULL COMMENT '企业名称', \`city\` varchar(50) NULL COMMENT '所在城市', \`address\` varchar(200) NULL COMMENT '地址', \`postal_code\` varchar(20) NULL COMMENT '邮政编码', \`phone\` varchar(50) NULL COMMENT '联系电话', \`is_gmp\` tinyint NULL COMMENT '是否GMP认证', PRIMARY KEY (\`approval_no\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`purchase_order\` (\`order_no\` varchar(50) NOT NULL COMMENT '采购单号', \`order_date\` date NOT NULL COMMENT '采购日期', \`manufacturer_approval_no\` varchar(50) NOT NULL, \`manufacturer_name\` varchar(100) NOT NULL COMMENT '企业名称', \`total_amount\` decimal(12,2) NULL COMMENT '总金额', \`purchaser\` varchar(50) NULL COMMENT '采购员', \`status\` enum ('待审核', '已审核', '部分入库', '全部入库', '已完成') NOT NULL COMMENT '状态' DEFAULT '待审核', \`create_time\` datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`order_no\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`purchase_detail\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '明细ID', \`order_no\` varchar(50) NOT NULL, \`drug_approval_no\` varchar(50) NOT NULL, \`drug_name\` varchar(100) NOT NULL COMMENT '药品名称', \`production_date\` date NOT NULL COMMENT '生产日期', \`validity_months\` int NOT NULL COMMENT '有效期(月)', \`quantity\` int NOT NULL COMMENT '采购数量', \`unit_price\` decimal(10,2) NOT NULL COMMENT '采购单价', \`amount\` decimal(12,2) AS (quantity * unit_price) STORED NOT NULL COMMENT '采购金额', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `INSERT INTO \`medicine\`.\`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        'medicine',
        'purchase_detail',
        'GENERATED_COLUMN',
        'amount',
        'quantity * unit_price',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE \`storage_location\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '货位ID', \`warehouse_id\` int NOT NULL, \`code\` varchar(20) NOT NULL COMMENT '货位号', \`capacity\` int NULL COMMENT '容量', \`description\` varchar(200) NULL COMMENT '描述', UNIQUE INDEX \`IDX_9acd183855adc53064c7633d06\` (\`warehouse_id\`, \`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`warehouse\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '仓库ID', \`code\` varchar(20) NOT NULL COMMENT '仓号', \`name\` varchar(100) NOT NULL COMMENT '仓库名称', \`address\` varchar(200) NULL COMMENT '仓库地址', \`manager\` varchar(50) NULL COMMENT '仓库管理员', UNIQUE INDEX \`IDX_dcbf22551ec3827f234e532a08\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`inventory\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '库存ID', \`warehouse_code\` varchar(20) NOT NULL COMMENT '仓号', \`location_code\` varchar(20) NOT NULL COMMENT '货位号', \`manufacturer_approval_no\` varchar(50) NULL, \`drug_approval_no\` varchar(50) NOT NULL, \`drug_name\` varchar(100) NOT NULL COMMENT '药品名称', \`batch_no\` varchar(50) NULL COMMENT '批号', \`production_date\` date NOT NULL COMMENT '生产日期', \`expiry_date\` date NOT NULL COMMENT '有效截止日期', \`quantity\` int NOT NULL COMMENT '库存数量' DEFAULT '0', \`last_update\` datetime(6) NOT NULL COMMENT '最后更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e6f5c1d4d787adc42b45ab459d\` (\`warehouse_code\`, \`location_code\`, \`drug_approval_no\`, \`batch_no\`, \`production_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`drug\` (\`approval_no\` varchar(50) NOT NULL COMMENT '药品批准号', \`name\` varchar(100) NOT NULL COMMENT '药品名称', \`scientific_name\` varchar(100) NULL COMMENT '学名', \`model\` varchar(50) NULL COMMENT '型号', \`specification\` varchar(100) NULL COMMENT '规格', \`is_prescription\` tinyint NULL COMMENT '是否处方药', PRIMARY KEY (\`approval_no\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_storage\` ADD CONSTRAINT \`FK_c9799a2073a3bcd853505a4e2ca\` FOREIGN KEY (\`order_no\`) REFERENCES \`purchase_order\`(\`order_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_storage\` ADD CONSTRAINT \`FK_1ce48a0112143e709561f48b750\` FOREIGN KEY (\`manufacturer_approval_no\`) REFERENCES \`manufacturer\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_storage\` ADD CONSTRAINT \`FK_8acc419dc0e23851a4d1bb53cec\` FOREIGN KEY (\`drug_approval_no\`) REFERENCES \`drug\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_outbound\` ADD CONSTRAINT \`FK_3d6f837451ab2af3045682d91a8\` FOREIGN KEY (\`order_no\`) REFERENCES \`sales_order\`(\`order_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_outbound\` ADD CONSTRAINT \`FK_8e76312695d0cdb112235112fb4\` FOREIGN KEY (\`institution_approval_no\`) REFERENCES \`medical_institution\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_outbound\` ADD CONSTRAINT \`FK_513a4a2a000416bf975d1486fcd\` FOREIGN KEY (\`drug_approval_no\`) REFERENCES \`drug\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_order\` ADD CONSTRAINT \`FK_7468f15aee0a7d4d573deff4b8a\` FOREIGN KEY (\`institution_approval_no\`) REFERENCES \`medical_institution\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` ADD CONSTRAINT \`FK_fbe899a0686df42b3c92d72e47f\` FOREIGN KEY (\`order_no\`) REFERENCES \`sales_order\`(\`order_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` ADD CONSTRAINT \`FK_f1b62c5fa57ff8008904c82d813\` FOREIGN KEY (\`manufacturer_approval_no\`) REFERENCES \`manufacturer\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` ADD CONSTRAINT \`FK_9339fae5998e5a5be7f1ca93bfd\` FOREIGN KEY (\`drug_approval_no\`) REFERENCES \`drug\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_order\` ADD CONSTRAINT \`FK_0e19535f3325a57bbc1c617e882\` FOREIGN KEY (\`manufacturer_approval_no\`) REFERENCES \`manufacturer\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_detail\` ADD CONSTRAINT \`FK_d7d0779d72a50a4116d0d2b5079\` FOREIGN KEY (\`order_no\`) REFERENCES \`purchase_order\`(\`order_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_detail\` ADD CONSTRAINT \`FK_3f346e6cd77d142806d978bc4b3\` FOREIGN KEY (\`drug_approval_no\`) REFERENCES \`drug\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`storage_location\` ADD CONSTRAINT \`FK_8dbfdf8bbdfa44f0e6b0c3e608c\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouse\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory\` ADD CONSTRAINT \`FK_80f3b852bbf87cc2ff12e538ddf\` FOREIGN KEY (\`drug_approval_no\`) REFERENCES \`drug\`(\`approval_no\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory\` ADD CONSTRAINT \`FK_a536ea40deca7f1755b70be3fef\` FOREIGN KEY (\`warehouse_code\`) REFERENCES \`warehouse\`(\`code\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`inventory\` DROP FOREIGN KEY \`FK_a536ea40deca7f1755b70be3fef\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`inventory\` DROP FOREIGN KEY \`FK_80f3b852bbf87cc2ff12e538ddf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`storage_location\` DROP FOREIGN KEY \`FK_8dbfdf8bbdfa44f0e6b0c3e608c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_detail\` DROP FOREIGN KEY \`FK_3f346e6cd77d142806d978bc4b3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_detail\` DROP FOREIGN KEY \`FK_d7d0779d72a50a4116d0d2b5079\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_order\` DROP FOREIGN KEY \`FK_0e19535f3325a57bbc1c617e882\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` DROP FOREIGN KEY \`FK_9339fae5998e5a5be7f1ca93bfd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` DROP FOREIGN KEY \`FK_f1b62c5fa57ff8008904c82d813\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` DROP FOREIGN KEY \`FK_fbe899a0686df42b3c92d72e47f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_order\` DROP FOREIGN KEY \`FK_7468f15aee0a7d4d573deff4b8a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_outbound\` DROP FOREIGN KEY \`FK_513a4a2a000416bf975d1486fcd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_outbound\` DROP FOREIGN KEY \`FK_8e76312695d0cdb112235112fb4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_outbound\` DROP FOREIGN KEY \`FK_3d6f837451ab2af3045682d91a8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_storage\` DROP FOREIGN KEY \`FK_8acc419dc0e23851a4d1bb53cec\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_storage\` DROP FOREIGN KEY \`FK_1ce48a0112143e709561f48b750\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_storage\` DROP FOREIGN KEY \`FK_c9799a2073a3bcd853505a4e2ca\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`drug\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e6f5c1d4d787adc42b45ab459d\` ON \`inventory\``,
    );
    await queryRunner.query(`DROP TABLE \`inventory\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_dcbf22551ec3827f234e532a08\` ON \`warehouse\``,
    );
    await queryRunner.query(`DROP TABLE \`warehouse\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9acd183855adc53064c7633d06\` ON \`storage_location\``,
    );
    await queryRunner.query(`DROP TABLE \`storage_location\``);
    await queryRunner.query(
      `DELETE FROM \`medicine\`.\`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'amount', 'medicine', 'purchase_detail'],
    );
    await queryRunner.query(`DROP TABLE \`purchase_detail\``);
    await queryRunner.query(`DROP TABLE \`purchase_order\``);
    await queryRunner.query(`DROP TABLE \`manufacturer\``);
    await queryRunner.query(
      `DELETE FROM \`medicine\`.\`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'amount', 'medicine', 'sales_detail'],
    );
    await queryRunner.query(`DROP TABLE \`sales_detail\``);
    await queryRunner.query(`DROP TABLE \`sales_order\``);
    await queryRunner.query(`DROP TABLE \`medical_institution\``);
    await queryRunner.query(`DROP TABLE \`sales_outbound\``);
    await queryRunner.query(`DROP TABLE \`purchase_storage\``);
  }
}
