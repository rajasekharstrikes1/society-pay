import { whatsappService } from './whatsapp';
import { Resident, MaintenanceRecord } from '../types';

export class MaintenanceNotificationService {
  async sendMaintenanceReminder(
    resident: Resident,
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
        resident.phone,
        resident.name,
        resident.flatNumber,
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
    resident: Resident,
    amount: number,
    transactionId: string,
    communityName: string
  ): Promise<boolean> {
    try {
      await whatsappService.sendPaymentConfirmation(
        resident.phone,
        resident.name,
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
    residents: Resident[],
    maintenanceRecords: MaintenanceRecord[],
    communityName: string,
    generatePaymentLink: (residentId: string, maintenanceId: string) => string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const resident of residents) {
      const maintenanceRecord = maintenanceRecords.find(
        record => record.residentId === resident.id && record.status === 'pending'
      );

      if (maintenanceRecord) {
        const paymentLink = generatePaymentLink(resident.id, maintenanceRecord.id);
        
        const sent = await this.sendMaintenanceReminder(
          resident,
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
    residents: Resident[],
    overdueRecords: MaintenanceRecord[],
    communityName: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const resident of residents) {
      const overdueRecord = overdueRecords.find(
        record => record.residentId === resident.id && record.status === 'overdue'
      );

      if (overdueRecord) {
        try {
          const daysPastDue = Math.floor(
            (new Date().getTime() - new Date(overdueRecord.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          await whatsappService.sendTextMessage(
            resident.phone,
            `Dear ${resident.name},\n\nYour maintenance payment for Flat ${resident.flatNumber} in ${communityName} is overdue by ${daysPastDue} days.\n\nAmount Due: ₹${overdueRecord.totalAmount.toLocaleString()}\n\nPlease make the payment immediately to avoid any inconvenience.\n\nThank you,\n${communityName} Management`
          );

          success++;
        } catch (error) {
          console.error(`Error sending overdue notice to ${resident.name}:`, error);
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