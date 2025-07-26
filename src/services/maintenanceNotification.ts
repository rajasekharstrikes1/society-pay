import { whatsappService } from './whatsapp';
import { Tenant, MaintenanceRecord } from '../types';

export class MaintenanceNotificationService {
  async sendMaintenanceReminder(
    tenant: Tenant,
    maintenanceRecord: MaintenanceRecord,
    paymentLink: string,
    communityName: string
  ): Promise<boolean> {
    try {
      const dueDate = new Date(maintenanceRecord.dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      await whatsappService.sendMaintenanceNotification(
        tenant.phone,
        tenant.name,
        tenant.flatNumber,
        maintenanceRecord.totalAmount,
        dueDate,
        paymentLink,
        communityName
      );

      return true;
    } catch (error) {
      console.error('Error sending maintenance reminder:', error);
      return false;
    }
  }

  async sendPaymentConfirmation(
    tenant: Tenant,
    amount: number,
    transactionId: string,
    communityName: string
  ): Promise<boolean> {
    try {
      await whatsappService.sendPaymentConfirmation(
        tenant.phone,
        tenant.name,
        amount,
        transactionId,
        communityName
      );

      return true;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      return false;
    }
  }

  async sendBulkReminders(
    tenants: Tenant[],
    maintenanceRecords: MaintenanceRecord[],
    communityName: string,
    generatePaymentLink: (tenantId: string, maintenanceId: string) => string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const tenant of tenants) {
      const maintenanceRecord = maintenanceRecords.find(
        record => record.tenantId === tenant.id && record.status === 'pending'
      );

      if (maintenanceRecord) {
        const paymentLink = generatePaymentLink(tenant.id, maintenanceRecord.id);
        
        const sent = await this.sendMaintenanceReminder(
          tenant,
          maintenanceRecord,
          paymentLink,
          communityName
        );

        if (sent) {
          success++;
        } else {
          failed++;
        }

        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }

  async sendOverdueNotices(
    tenants: Tenant[],
    overdueRecords: MaintenanceRecord[],
    communityName: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const tenant of tenants) {
      const overdueRecord = overdueRecords.find(
        record => record.tenantId === tenant.id && record.status === 'overdue'
      );

      if (overdueRecord) {
        try {
          const daysPastDue = Math.floor(
            (new Date().getTime() - new Date(overdueRecord.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          await whatsappService.sendTextMessage(
            tenant.phone,
            `Dear ${tenant.name},\n\nYour maintenance payment for Flat ${tenant.flatNumber} in ${communityName} is overdue by ${daysPastDue} days.\n\nAmount Due: ₹${overdueRecord.totalAmount.toLocaleString()}\n\nPlease make the payment immediately to avoid any inconvenience.\n\nThank you,\n${communityName} Management`
          );

          success++;
        } catch (error) {
          console.error(`Error sending overdue notice to ${tenant.name}:`, error);
          failed++;
        }

        // Add delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }
}

export const maintenanceNotificationService = new MaintenanceNotificationService();