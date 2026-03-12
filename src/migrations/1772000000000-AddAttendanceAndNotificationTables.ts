import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttendanceAndNotificationTables1772000000000
  implements MigrationInterface
{
  name = "AddAttendanceAndNotificationTables1772000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`attendance\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`workerId\` varchar(36) NOT NULL,
        \`date\` date NOT NULL,
        \`status\` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        \`timeIn\` datetime NULL,
        \`timeApproved\` datetime NULL,
        \`approvedBy\` varchar(36) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_attendance_worker_date\` (\`workerId\`, \`date\`),
        KEY \`IDX_attendance_approvedBy\` (\`approvedBy\`),
        CONSTRAINT \`FK_attendance_worker\` FOREIGN KEY (\`workerId\`) REFERENCES \`worker\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_attendance_approvedBy_worker\` FOREIGN KEY (\`approvedBy\`) REFERENCES \`worker\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification\` (
        \`id\` char(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`message\` varchar(255) NOT NULL,
        \`type\` varchar(50) NOT NULL,
        \`isRead\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_notification_user\` (\`userId\`),
        CONSTRAINT \`FK_notification_user\` FOREIGN KEY (\`userId\`) REFERENCES \`worker\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_notification_user\`
    `);
    await queryRunner.query(`
      DROP TABLE \`notification\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`attendance\`
      DROP FOREIGN KEY \`FK_attendance_worker\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`attendance\`
      DROP FOREIGN KEY \`FK_attendance_approvedBy_worker\`
    `);
    await queryRunner.query(`
      DROP TABLE \`attendance\`
    `);
  }
}

