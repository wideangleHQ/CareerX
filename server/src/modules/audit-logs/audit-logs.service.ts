import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repository: AuditLogsRepository) {}

  async getAuditLogs(filters: AuditFilterDto) {
    return this.repository.findAll(filters);
  }

  async getAuditLogById(id: string) {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  async createAuditLog(data: Omit<Prisma.audit_logsUncheckedCreateInput, 'id' | 'created_at'>) {
    // Mask sensitive fields if necessary before storing
    const safeData = this.maskSensitiveData(data);
    return this.repository.create(safeData);
  }

  private maskSensitiveData(data: Omit<Prisma.audit_logsUncheckedCreateInput, 'id' | 'created_at'>) {
    const cloned = { ...data };
    
    const maskString = (val: string) => {
      try {
        const parsed = JSON.parse(val);
        if (parsed.password) parsed.password = '***';
        if (parsed.token) parsed.token = '***';
        if (parsed.secret) parsed.secret = '***';
        return JSON.stringify(parsed);
      } catch (e) {
        return val; // Not a JSON string or cannot be masked easily
      }
    };

    if (cloned.old_value) cloned.old_value = maskString(cloned.old_value);
    if (cloned.new_value) cloned.new_value = maskString(cloned.new_value);
    
    return cloned;
  }
}
