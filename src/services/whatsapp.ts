import { WhatsAppConfig, WhatsAppMessage, WhatsAppTemplate } from '../types';

// Additional type definitions for WhatsApp service
interface WhatsAppResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename: string;
  };
  video?: {
    link: string;
  };
}

interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: string;
  parameters: WhatsAppTemplateParameter[];
}

interface WhatsAppInteractiveSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

interface WhatsAppButton {
  id: string;
  title: string;
}

class WhatsAppService {
  private config: WhatsAppConfig | null = null;

  setConfig(config: WhatsAppConfig) {
    this.config = config;
  }

  private getHeaders() {
    if (!this.config) {
      throw new Error('WhatsApp configuration not set');
    }

    return {
      'wabaNumber': this.config.wabaNumber,
      'Key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private getBaseUrl() {
    return this.config?.baseUrl || 'https://cpaasreseller.notify24x7.com/REST/directApi';
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/message`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to,
      type: 'text',
      recipient_type: 'individual',
      text: {
        body: text,
      },
    };

    return this.sendMessage(message);
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    parameters?: WhatsAppTemplateComponent[]
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
          policy: 'deterministic',
        },
        components: parameters || [],
      },
    };

    return this.sendMessage(message);
  }

  async sendMaintenanceNotification(
    to: string,
    tenantName: string,
    flatNumber: string,
    amount: number,
    dueDate: string,
    paymentLink: string,
    communityName: string
  ): Promise<WhatsAppResponse> {
    // Using template message for maintenance notification
    const templateName = 'maintenance_reminder'; // This should be created in WhatsApp Business Manager
    
    const parameters: WhatsAppTemplateComponent[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: tenantName },
          { type: 'text', text: flatNumber },
          { type: 'text', text: communityName },
          { type: 'text', text: `₹${amount.toLocaleString()}` },
          { type: 'text', text: dueDate },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          { type: 'text', text: paymentLink },
        ],
      },
    ];

    return this.sendTemplateMessage(to, templateName, 'en', parameters);
  }

  async sendPaymentConfirmation(
    to: string,
    tenantName: string,
    amount: number,
    transactionId: string,
    communityName: string
  ): Promise<WhatsAppResponse> {
    const templateName = 'payment_confirmation';
    
    const parameters: WhatsAppTemplateComponent[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: tenantName },
          { type: 'text', text: `₹${amount.toLocaleString()}` },
          { type: 'text', text: communityName },
          { type: 'text', text: transactionId },
        ],
      },
    ];

    return this.sendTemplateMessage(to, templateName, 'en', parameters);
  }

  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to,
      type: 'image',
      recipient_type: 'individual',
      image: {
        link: imageUrl,
        caption: caption || '',
      },
    };

    return this.sendMessage(message);
  }

  async sendDocumentMessage(
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to,
      type: 'document',
      recipient_type: 'individual',
      document: {
        link: documentUrl,
        filename,
        caption: caption || '',
      },
    };

    return this.sendMessage(message);
  }

  async sendInteractiveListMessage(
    to: string,
    headerText: string,
    bodyText: string,
    footerText: string,
    buttonText: string,
    sections: WhatsAppInteractiveSection[]
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: headerText,
        },
        body: {
          text: bodyText,
        },
        footer: {
          text: footerText,
        },
        action: {
          button: buttonText,
          sections,
        },
      },
    };

    return this.sendMessage(message);
  }

  async sendInteractiveButtonMessage(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[]
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.map(button => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        },
      },
    };

    return this.sendMessage(message);
  }

  // Mock function to fetch templates (you'll need to implement actual API endpoint)
  async fetchTemplates(): Promise<WhatsAppTemplate[]> {
    // This is a mock implementation
    // You'll need to implement the actual API call to fetch templates from Dovesoft
    return [
      {
        id: '1',
        name: 'maintenance_reminder',
        language: 'en',
        status: 'APPROVED',
        category: 'UTILITY',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: 'Maintenance Due - {{1}}',
          },
          {
            type: 'BODY',
            text: 'Dear {{1}},\n\nYour maintenance fee for Flat {{2}} in {{3}} is due.\n\nAmount: {{4}}\nDue Date: {{5}}\n\nPlease pay at your earliest convenience.',
          },
          {
            type: 'FOOTER',
            text: 'Thank you for your cooperation.',
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'URL',
                text: 'Pay Now',
                url: 'https://pay.example.com/{{1}}',
              },
            ],
          },
        ],
      },
      {
        id: '2',
        name: 'payment_confirmation',
        language: 'en',
        status: 'APPROVED',
        category: 'UTILITY',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: 'Payment Received',
          },
          {
            type: 'BODY',
            text: 'Dear {{1}},\n\nWe have received your maintenance payment of {{2}} for {{3}}.\n\nTransaction ID: {{4}}\n\nThank you for your payment!',
          },
          {
            type: 'FOOTER',
            text: 'SocietyPay - Maintenance Management',
          },
        ],
      },
    ];
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
