import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { DepartmentSyncService } from '../../integrations/performx/department-sync.service';
import { PerformxClient } from '../../integrations/performx/performx.client';
import { PerformxCircuitBreaker } from '../auth/utils/circuit-breaker.util';

const HIRING_DEPARTMENTS_CACHE_KEY = 'career:cache:departments:hiring';
const HIRING_DEPARTMENTS_CACHE_TTL_SECONDS = 5 * 60;

export interface DepartmentListItem {
  id: string;
  name: string;
  isHiringEnabled: boolean;
  syncedAt: Date;
}

export interface HiringDepartmentItem {
  id: string; // The department ID (used by frontend for applications)
  name: string; // The public_t
  // itle for backwards compatibility
  
  // Rich public details
  opportunityId?: string | undefined;
  departmentName?: string | undefined;
  careerLevel?: string | undefined;
  employmentType?: string | undefined;
  workMode?: string | undefined;
  location?: string | undefined;
  experienceRange?: string | undefined;
  salaryRange?: string | undefined;
  shortDescription?: string | undefined;
  primarySkills?: string[] | undefined;
  requiredSkills?: string[] | undefined;
  preferredSkills?: string[] | undefined;
  
  about?: string | undefined;
  responsibilities?: string | undefined;
  benefits?: string | undefined;
  careerGrowth?: string | undefined;
  educationalQualification?: string | undefined;
  numberOfOpenings?: number | undefined;
  publishedAt?: Date | undefined;
  applicationDeadline?: Date | undefined;
  resumeRequired?: boolean | undefined;
  employmentProofRequired?: boolean | undefined;
  isAcceptingApplications?: boolean | undefined;
}

export interface DepartmentSyncSummary {
  synced: number;
}

@Injectable()
export class DepartmentsService {
  private readonly breaker: PerformxCircuitBreaker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly performxClient: PerformxClient,
    private readonly departmentSync: DepartmentSyncService,
  ) {
    this.breaker = new PerformxCircuitBreaker(redis);
  }

  async getHiringDepartments(query: any = {}): Promise<HiringDepartmentItem[]> {
    // Dynamic Cache Key based on query params to prevent caching filtered results as default
    const cacheKey = Object.keys(query).length > 0 
      ? `${HIRING_DEPARTMENTS_CACHE_KEY}:${Buffer.from(JSON.stringify(query)).toString('base64')}` 
      : HIRING_DEPARTMENTS_CACHE_KEY;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached) as HiringDepartmentItem[]; } catch { await this.redis.del(cacheKey); }
    }

    try {
      const take = Math.min(parseInt(query.limit) || 50, 100);
      const skip = parseInt(query.skip) || 0;

      // Filtering logic for the Career Portal
      const whereFilters: import('@prisma/client').Prisma.hiring_opportunitiesWhereInput = {
        status: 'PUBLISHED',
      };

      if (query.departmentId) whereFilters.department_id = query.departmentId;
      if (query.location) whereFilters.location = { contains: query.location, mode: 'insensitive' };
      if (query.workMode) whereFilters.work_mode = query.workMode;
      if (query.employmentType) whereFilters.hiring_type = query.employmentType;
      if (query.careerLevel) whereFilters.career_level = query.careerLevel;
      if (query.search) {
        whereFilters.OR = [
          { public_title: { contains: query.search, mode: 'insensitive' } },
          { about: { contains: query.search, mode: 'insensitive' } },
          { responsibilities: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // We query hiring_opportunities directly because it is the actual business entity, 
      // but we return it in the shape of HiringDepartmentItem for backwards API compatibility.
      const opportunities = await this.prisma.hiring_opportunities.findMany({
        where: whereFilters,
        select: {
          id: true,
          public_title: true,
          career_level: true,
          hiring_type: true,
          work_mode: true,
          location: true,
          min_experience_years: true,
          max_experience_years: true,
          min_salary: true,
          max_salary: true,
          application_deadline: true,
          resume_required: true,
          employment_proof_required: true,
          about: true,
          responsibilities: true,
          benefits: true,
          career_growth: true,
          educational_qualification: true,
          number_of_openings: true,
          created_at: true,
          department_id: true,
          department: { select: { name: true, is_hiring_enabled: true } },
          opportunity_skills: { 
            include: { skill: true }
          }
        },
        orderBy: query.sort === 'oldest' ? { created_at: 'asc' } : { created_at: 'desc' },
        take,
        skip,
      });

      // Strict Public Whitelist Mapping
      const enrichedDepartments: HiringDepartmentItem[] = opportunities
        .filter(opp => opp.department?.is_hiring_enabled) // Double check department is still enabled
        .map((opp) => {
          const now = new Date();
          const isClosed = opp.application_deadline ? new Date(opp.application_deadline) < now : false;

          return {
            id: opp.department_id, // Legacy compatibility: use department_id as the primary identifier
            name: opp.public_title, // Legacy compatibility
            
            opportunityId: opp.id,
            departmentName: opp.department?.name,
            careerLevel: opp.career_level || undefined,
            employmentType: opp.hiring_type || undefined,
            workMode: opp.work_mode || undefined,
            location: opp.location || undefined,
            experienceRange: opp.max_experience_years ? `${opp.min_experience_years} - ${opp.max_experience_years} Years` : `${opp.min_experience_years}+ Years`,
            salaryRange: (opp.min_salary && opp.max_salary) ? `${opp.min_salary} - ${opp.max_salary}` : undefined,
            shortDescription: opp.about?.substring(0, 150) || undefined,
            
            requiredSkills: opp.opportunity_skills.filter(os => !os.is_preferred).map(os => os.skill.name),
            preferredSkills: opp.opportunity_skills.filter(os => os.is_preferred).map(os => os.skill.name),
            
            about: opp.about || undefined,
            responsibilities: opp.responsibilities || undefined,
            benefits: opp.benefits || undefined,
            careerGrowth: opp.career_growth || undefined,
            educationalQualification: opp.educational_qualification || undefined,
            numberOfOpenings: opp.number_of_openings,
            publishedAt: opp.created_at,
            applicationDeadline: opp.application_deadline || undefined,
            resumeRequired: opp.resume_required,
            employmentProofRequired: opp.employment_proof_required,
            isAcceptingApplications: !isClosed,
          };
      });

      await this.redis.set(cacheKey, JSON.stringify(enrichedDepartments), HIRING_DEPARTMENTS_CACHE_TTL_SECONDS);
      return enrichedDepartments;
    } catch {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async getAllDepartments(): Promise<DepartmentListItem[]> {
    const localDepts = await this.prisma.departments.findMany({
      select: { id: true, name: true, is_hiring_enabled: true, synced_at: true },
      orderBy: { name: 'asc' },
    });

    if (localDepts.length > 0) {
      return localDepts.map((d) => ({
        id: d.id,
        name: d.name,
        isHiringEnabled: d.is_hiring_enabled,
        syncedAt: d.synced_at,
      }));
    }

    const performxDepts = await this.departmentSync.getDepartments();
    return performxDepts.map((dept) => ({
      id: dept.id,
      name: dept.name,
      isHiringEnabled: false,
      syncedAt: new Date(),
    }));
  }

  async toggleHiring(id: string, dto: import('./dto/toggle-hiring.dto').ToggleHiringDto): Promise<DepartmentListItem> {
    try {
      const existing = await this.prisma.departments.findUnique({
        where: { id },
        select: { id: true, name: true },
      });
      if (!existing) throw new NotFoundException('Not Found');

      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.departments.update({
          where: { id },
          data: { is_hiring_enabled: dto.isHiringEnabled },
          select: {
            id: true,
            name: true,
            is_hiring_enabled: true,
            synced_at: true,
          },
        });

        if (dto.isHiringEnabled || dto.status) {
          const existingOpp = await tx.hiring_opportunities.findFirst({
            where: { department_id: id },
            select: { id: true }
          });
          
          const oppData = {
            department_id: id,
            internal_position: dto.internalPosition || existing.name,
            number_of_openings: dto.numberOfOpenings || 1,
            hiring_priority: dto.hiringPriority || 'MEDIUM',
            hiring_type: dto.hiringType || 'FULL_TIME',
            confidentiality_level: dto.confidentialityLevel || 'STANDARD',
            hiring_manager_id: dto.hiringManagerId,
            reporting_manager_id: dto.reportingManagerId,
            internal_notes: dto.internalNotes,
            
            public_title: dto.publicTitle || existing.name,
            career_level: dto.careerLevel || 'MID_LEVEL',
            work_mode: dto.workMode || 'ON_SITE',
            location: dto.location || 'HQ',
            min_experience_years: dto.minExperienceYears || 0,
            max_experience_years: dto.maxExperienceYears,
            educational_qualification: dto.educationalQualification,
            
            about: dto.about,
            responsibilities: dto.responsibilities,
            benefits: dto.benefits,
            career_growth: dto.careerGrowth,
            status: dto.status || (dto.isHiringEnabled ? 'PUBLISHED' : 'DRAFT'),
          };

          if (existingOpp) {
            await tx.hiring_opportunities.update({
              where: { id: existingOpp.id },
              data: { ...oppData, updated_at: new Date() } as any
            });
          } else {
            await tx.hiring_opportunities.create({ data: oppData as any });
          }
        }

        await tx.audit_logs.create({
          data: {
            action: dto.isHiringEnabled ? 'OPPORTUNITY_PUBLISHED' : 'OPPORTUNITY_DRAFT_OR_CLOSED',
            entity: 'departments',
            entity_id: id,
            new_value: JSON.stringify({ isHiringEnabled: dto.isHiringEnabled, status: dto.status })
          }
        });

        await this.redis.del(HIRING_DEPARTMENTS_CACHE_KEY);
        // Clean up legacy redis meta key
        await this.redis.del(`career:dept:${id}:meta`);

        return {
          id: updated.id,
          name: updated.name,
          isHiringEnabled: updated.is_hiring_enabled,
          syncedAt: updated.synced_at,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async syncFromPerformx(): Promise<DepartmentSyncSummary> {
    console.log('========== DEPARTMENT SYNC STARTED ==========');
    await this.breaker.assertClosed();

    try {
      const result = await this.departmentSync.refreshCache();
console.log('Refresh Cache Result:', result);

const departments = await this.departmentSync.getDepartments();

console.log('Departments fetched:', departments.length);
console.log('First Department:', departments[0]);
console.log('Starting Prisma Transaction...');

      await this.prisma.$transaction(
        departments.map((dept) =>
          this.prisma.departments.upsert({
            where: { id: dept.id },
            update: { name: dept.name, synced_at: new Date() },
            create: {
              id: dept.id,
              name: dept.name,
              is_hiring_enabled: false,
              synced_at: new Date(),
            },
          }),
        ),
      );
      console.log('Prisma Transaction Completed Successfully');

      await this.redis.del(HIRING_DEPARTMENTS_CACHE_KEY);
      await this.breaker.recordSuccess();
      return { synced: result.synced };
    } catch (error) {
  console.error('==========================');
  console.error('Department Sync Failed');
  console.error(error);
  console.error('==========================');

  throw error;
      //throw new InternalServerErrorException('Internal Server Error');
    }
  }
}
