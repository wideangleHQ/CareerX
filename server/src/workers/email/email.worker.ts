import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { log_status_enum } from '@prisma/client';

interface EmailJobData {
  logId: string;
  recipient: string;
  rendered: {
    subject: string;
    html: string;
    text: string;
  };
  attachments: Array<{
    filename: string;
    contentBase64: string;
    contentType: string;
  }>;
}

@Processor('email', { concurrency: 5, drainDelay: 60, stalledInterval: 300000 })
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`Processing email job ${job.id} for ${job.data.recipient}`);
    const { logId, recipient, rendered, attachments } = job.data;

    try {
      const messageId = await this.sendEmail(recipient, rendered, attachments);
      
      await this.prisma.email_logs.update({
        where: { id: logId },
        data: { 
          status: log_status_enum.SENT,
          sent_at: new Date(),
          provider_response: JSON.stringify({ messageId })
        },
      });

      this.logger.log(`Email sent successfully to ${recipient}, messageId: ${messageId}`);
      return { success: true, messageId };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email job ${job.id}:`, error instanceof Error ? error.stack : errorMessage);
      
      await this.prisma.email_logs.update({
        where: { id: logId },
        data: { 
          status: log_status_enum.FAILED,
          error_message: errorMessage
        },
      });
      
      throw error; // Let BullMQ handle retries
    }
  }

  private async sendEmail(
    recipient: string, 
    rendered: EmailJobData['rendered'], 
    attachments: EmailJobData['attachments']
  ): Promise<string> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    
    if (!apiKey || !from) {
      throw new Error('Email provider configuration missing');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.contentBase64,
          content_type: attachment.contentType,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email provider error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as { id?: string };
    return result.id || 'unknown';
  }

  private validateJobData(data: any): asserts data is EmailJobData {
    if (
      !data ||
      typeof data.logId !== 'string' ||
      typeof data.recipient !== 'string' ||
      typeof data.rendered?.subject !== 'string' ||
      typeof data.rendered?.html !== 'string' ||
      typeof data.rendered?.text !== 'string' ||
      !Array.isArray(data.attachments)
    ) {
      throw new Error('Invalid email job data structure');
    }
  }
}
