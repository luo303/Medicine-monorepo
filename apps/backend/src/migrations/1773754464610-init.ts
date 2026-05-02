import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1773754464610 implements MigrationInterface {
  name = 'Init1773754464610';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`drug\` CHANGE \`is_prescription\` \`is_rescription\` tinyint NULL COMMENT '是否处方药'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` CHANGE \`amount\` \`amount\` decimal(12,2) AS (quantity * unit_price) STORED NOT NULL COMMENT '销售金额'`,
    );
    await queryRunner.query(
      `UPDATE \`medicine\`.\`typeorm_metadata\` SET \`value\` = ? WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      [
        'quantity * unit_price',
        'GENERATED_COLUMN',
        'amount',
        'medicine',
        'sales_detail',
      ],
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_detail\` CHANGE \`amount\` \`amount\` decimal(12,2) AS (quantity * unit_price) STORED NOT NULL COMMENT '采购金额'`,
    );
    await queryRunner.query(
      `UPDATE \`medicine\`.\`typeorm_metadata\` SET \`value\` = ? WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      [
        'quantity * unit_price',
        'GENERATED_COLUMN',
        'amount',
        'medicine',
        'purchase_detail',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`medicine\`.\`typeorm_metadata\` SET \`value\` = ? WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['', 'GENERATED_COLUMN', 'amount', 'medicine', 'purchase_detail'],
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_detail\` CHANGE \`amount\` \`amount\` decimal(12,2) NOT NULL COMMENT '采购金额'`,
    );
    await queryRunner.query(
      `UPDATE \`medicine\`.\`typeorm_metadata\` SET \`value\` = ? WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['', 'GENERATED_COLUMN', 'amount', 'medicine', 'sales_detail'],
    );
    await queryRunner.query(
      `ALTER TABLE \`sales_detail\` CHANGE \`amount\` \`amount\` decimal(12,2) NOT NULL COMMENT '销售金额'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`drug\` CHANGE \`is_rescription\` \`is_prescription\` tinyint NULL COMMENT '是否处方药'`,
    );
  }
}
