export type ReminderFrequency = "daily" | "weekly" | "monthly" | "yearly" | "once" | "custom";

export interface Reminder {
  _id: string;
  title: string;
  description?: string;
  enabled: boolean;
  frequency: ReminderFrequency;
  interval?: number;
  startDate: string;
  time: string;
  nextOccurrence?: string;
  lastEmailSentDate?: string;
  createdBy: string;
  recipientEmails?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  title: string;
  description?: string;
  enabled: boolean;
  frequency: ReminderFrequency;
  interval?: number;
  startDate: string;
  time: string;
  recipientEmails?: string[];
  metadata?: Record<string, unknown>;
}
