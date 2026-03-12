"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAttendanceAndNotificationTables1772000000000 = void 0;
class AddAttendanceAndNotificationTables1772000000000 {
    constructor() {
        this.name = "AddAttendanceAndNotificationTables1772000000000";
    }
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.query(`
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
            yield queryRunner.query(`
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
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.query(`
      ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_notification_user\`
    `);
            yield queryRunner.query(`
      DROP TABLE \`notification\`
    `);
            yield queryRunner.query(`
      ALTER TABLE \`attendance\`
      DROP FOREIGN KEY \`FK_attendance_worker\`
    `);
            yield queryRunner.query(`
      ALTER TABLE \`attendance\`
      DROP FOREIGN KEY \`FK_attendance_approvedBy_worker\`
    `);
            yield queryRunner.query(`
      DROP TABLE \`attendance\`
    `);
        });
    }
}
exports.AddAttendanceAndNotificationTables1772000000000 = AddAttendanceAndNotificationTables1772000000000;
