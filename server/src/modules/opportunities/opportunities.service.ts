import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

const HIRING_DEPARTMENTS_CACHE_KEY = 'career:cache:departments:hiring';

@Injectable()
export class OpportunitiesService {
  private readonly logger = new Logger(OpportunitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(dto: any) {
    this.logger.log('=== CREATE OPPORTUNITY START ===');
    this.logger.log('Incoming body:', JSON.stringify(dto, null, 2));

    try {
      // Validate required fields
      const requiredFields = ['internal_position', 'department_id', 'public_title', 'location'];
      const missing = requiredFields.filter(field => !dto[field]);
      if (missing.length > 0) {
        throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
      }

      // Build create payload matching schema exactly
      const createData: any = {
        internal_position: dto.internal_position,
        department_id: dto.department_id,
        public_title: dto.public_title,
        location: dto.location,
        
        // Fields with defaults in schema
        number_of_openings: dto.number_of_openings ?? 1,
        hiring_priority: dto.hiring_priority ?? 'MEDIUM',
        hiring_type: dto.hiring_type ?? 'FULL_TIME',
        confidentiality_level: dto.confidentiality_level ?? 'STANDARD',
        career_level: dto.career_level ?? 'MID_LEVEL',
        work_mode: dto.work_mode ?? 'ON_SITE',
        min_experience_years: dto.min_experience_years ?? 0,
        resume_required: dto.resume_required ?? true,
        employment_proof_required: dto.employment_proof_required ?? false,
        interview_rounds: dto.interview_rounds ?? 1,
        status: dto.status ?? 'DRAFT',
        visibility: dto.visibility ?? 'CAREER_PORTAL',
        
        // Optional text fields
        internal_notes: dto.internal_notes ?? null,
        about: dto.about ?? null,
        responsibilities: dto.responsibilities ?? null,
        benefits: dto.benefits ?? null,
        career_growth: dto.career_growth ?? null,
        
        // Optional UUID fields
        hiring_manager_id: dto.hiring_manager_id ?? null,
        reporting_manager_id: dto.reporting_manager_id ?? null,
        
        // Optional numeric fields
        max_experience_years: dto.max_experience_years ?? null,
        age_limit: dto.age_limit ?? null,
        min_salary: dto.min_salary ?? null,
        max_salary: dto.max_salary ?? null,
        
        // Optional string fields
        educational_qualification: dto.educational_qualification ?? null,
        preferred_industry: dto.preferred_industry ?? null,
        interview_location: dto.interview_location ?? null,
        meeting_link: dto.meeting_link ?? null,
        
        // Optional date field
        application_deadline: dto.application_deadline ? new Date(dto.application_deadline) : null,
        
        // Array fields (default to empty arrays)
        preferred_languages: dto.preferred_languages ?? [],
        certifications: dto.certifications ?? [],
        
        // Timestamps - let DB defaults handle these
        // created_at and updated_at have @default(now())
      };

      this.logger.log('Prisma create payload:', JSON.stringify(createData, null, 2));

      const opportunity = await this.prisma.hiring_opportunities.create({
        data: createData,
      });

      if (createData.status === 'PUBLISHED') {
        await this.syncDepartmentHiringFlag(createData.department_id);
      }

      this.logger.log('Opportunity created successfully:', opportunity.id);

      return {
        success: true,
        data: opportunity,
      };
    } catch (error: any) {
      this.logger.error('=== CREATE OPPORTUNITY FAILED ===');
      this.logger.error('Error name:', error.name);
      this.logger.error('Error code:', error.code);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error meta:', JSON.stringify(error.meta, null, 2));
      this.logger.error('Full error:', JSON.stringify(error, null, 2));
      this.logger.error('Stack trace:', error.stack);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry: ' + JSON.stringify(error.meta));
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed: ' + JSON.stringify(error.meta));
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Related record not found: ' + JSON.stringify(error.meta));
      }

      throw error;
    }
  }

  async findPublic(query: any = {}) {
    const take = Math.min(parseInt(query.limit) || 50, 100);
    const skip = parseInt(query.skip) || 0;

    const where: any = {
      status: 'PUBLISHED',
      visibility: 'CAREER_PORTAL',
      deleted_at: null,
    };

    if (query.departmentId) where.department_id = query.departmentId;
    if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
    if (query.workMode) where.work_mode = query.workMode;
    if (query.employmentType) where.hiring_type = query.employmentType;
    if (query.careerLevel) where.career_level = query.careerLevel;
    if (query.search) {
      where.OR = [
        { public_title: { contains: query.search, mode: 'insensitive' } },
        { about: { contains: query.search, mode: 'insensitive' } },
        { responsibilities: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const opportunities = await this.prisma.hiring_opportunities.findMany({
      where,
      select: {
        id: true,
        public_title: true,
        career_level: true,
        hiring_type: true,
        hiring_priority: true,
        work_mode: true,
        location: true,
        min_experience_years: true,
        max_experience_years: true,
        min_salary: true,
        max_salary: true,
        about: true,
        responsibilities: true,
        benefits: true,
        career_growth: true,
        educational_qualification: true,
        number_of_openings: true,
        resume_required: true,
        employment_proof_required: true,
        application_deadline: true,
        created_at: true,
        department_id: true,
        department: { select: { id: true, name: true } },
        opportunity_skills: { include: { skill: true } },
      },
      orderBy: query.sort === 'oldest' ? { created_at: 'asc' } : { created_at: 'desc' },
      take,
      skip,
    });

    const data = opportunities.map((opp) => ({
      opportunityId: opp.id,
      name: opp.public_title,
      departmentId: opp.department_id,
      departmentName: opp.department?.name,
      careerLevel: opp.career_level || undefined,
      employmentType: opp.hiring_type || undefined,
      hiringPriority: opp.hiring_priority || undefined,
      workMode: opp.work_mode || undefined,
      location: opp.location || undefined,
      experienceRange: opp.max_experience_years
        ? `${opp.min_experience_years} - ${opp.max_experience_years} Years`
        : `${opp.min_experience_years}+ Years`,
      salaryRange: opp.min_salary && opp.max_salary
        ? `${opp.min_salary} - ${opp.max_salary}`
        : undefined,
      shortDescription: opp.about?.substring(0, 150) || undefined,
      about: opp.about || undefined,
      responsibilities: opp.responsibilities || undefined,
      benefits: opp.benefits || undefined,
      careerGrowth: opp.career_growth || undefined,
      educationalQualification: opp.educational_qualification || undefined,
      numberOfOpenings: opp.number_of_openings,
      requiredSkills: opp.opportunity_skills.filter((os) => !os.is_preferred).map((os) => os.skill.name),
      preferredSkills: opp.opportunity_skills.filter((os) => os.is_preferred).map((os) => os.skill.name),
      publishedAt: opp.created_at,
      applicationDeadline: opp.application_deadline || undefined,
      resumeRequired: opp.resume_required,
      employmentProofRequired: opp.employment_proof_required,
      isAcceptingApplications: opp.application_deadline
        ? new Date(opp.application_deadline) >= new Date()
        : true,
    }));

    return { success: true, data };
  }

  async findAll(query: any) {
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const status = query.status;

    const where: any = {};
    if (status) where.status = status;

    const opportunities = await this.prisma.hiring_opportunities.findMany({
      where,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: opportunities,
    };
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.hiring_opportunities.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return {
      success: true,
      data: opportunity,
    };
  }

  async update(id: string, dto: any) {
    const opportunity = await this.prisma.hiring_opportunities.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });

    if (dto.status || dto.department_id) {
      await this.syncDepartmentHiringFlag(opportunity.department_id);
    }

    return {
      success: true,
      data: opportunity,
    };
  }

  async updateStatus(id: string, dto: { status: string }) {
    const opportunity = await this.prisma.hiring_opportunities.update({
      where: { id },
      data: {
        status: dto.status as any,
        updated_at: new Date(),
      },
    });

    await this.syncDepartmentHiringFlag(opportunity.department_id);

    return {
      success: true,
      data: opportunity,
    };
  }

  async remove(id: string) {
    const opportunity = await this.prisma.hiring_opportunities.delete({
      where: { id },
    });

    await this.syncDepartmentHiringFlag(opportunity.department_id);

    return {
      success: true,
    };
  }

  async getStats() {
    const [total, draft, published, closed] = await Promise.all([
      this.prisma.hiring_opportunities.count(),
      this.prisma.hiring_opportunities.count({ where: { status: 'DRAFT' } }),
      this.prisma.hiring_opportunities.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.hiring_opportunities.count({ where: { status: 'CLOSED' } }),
    ]);

    return {
      success: true,
      data: {
        total,
        draft,
        published,
        closed,
      },
    };
  }

  private async syncDepartmentHiringFlag(departmentId: string): Promise<void> {
    const publishedCount = await this.prisma.hiring_opportunities.count({
      where: { department_id: departmentId, status: 'PUBLISHED' },
    });

    await this.prisma.departments.update({
      where: { id: departmentId },
      data: { is_hiring_enabled: publishedCount > 0 },
    });

    await this.invalidateHiringCache();
  }

  private async invalidateHiringCache(): Promise<void> {
    await this.redis.delByPattern(`${HIRING_DEPARTMENTS_CACHE_KEY}*`);
  }
}
