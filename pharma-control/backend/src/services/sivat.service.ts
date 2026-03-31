import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

// ── Types ──

export interface CreateSivatInput {
  patientName: string;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  scoreE: number | null;
  sectionEEnabled: boolean;
  supportLevel: number | null;
  totalScore: number;
  rawScore: number;
  maxPossible: number;
  classification: string;
  pdcPercentage?: number | null;
  pdcDaysCovered?: number | null;
  pdcDaysObserved?: number | null;
  answers: Record<string, number | null>;
  criticalities: string[];
  interventions: string[];
}

export interface ListFilters {
  userId?: string;
  patientName?: string;
  classification?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

function serialize(assessment: Record<string, unknown>) {
  return {
    ...assessment,
    pdcPercentage: assessment.pdc_percentage
      ? Number(assessment.pdc_percentage)
      : null,
    // Flatten snake_case to camelCase
    id: assessment.id,
    userId: assessment.user_id,
    patientName: assessment.patient_name,
    scoreA: assessment.score_a,
    scoreB: assessment.score_b,
    scoreC: assessment.score_c,
    scoreD: assessment.score_d,
    scoreE: assessment.score_e,
    sectionEEnabled: assessment.section_e_enabled,
    supportLevel: assessment.support_level,
    totalScore: assessment.total_score,
    rawScore: assessment.raw_score,
    maxPossible: assessment.max_possible,
    classification: assessment.classification,
    pdcDaysCovered: assessment.pdc_days_covered,
    pdcDaysObserved: assessment.pdc_days_observed,
    answers: assessment.answers,
    criticalities: assessment.criticalities,
    interventions: assessment.interventions,
    createdAt: assessment.created_at,
    userName: (assessment as Record<string, unknown> & { user?: { name: string } }).user?.name,
  };
}

// ── CRUD ──

export async function createAssessment(data: CreateSivatInput, userId: string) {
  const assessment = await prisma.sivatAssessment.create({
    data: {
      user_id: userId,
      patient_name: data.patientName.trim(),
      score_a: data.scoreA,
      score_b: data.scoreB,
      score_c: data.scoreC,
      score_d: data.scoreD,
      score_e: data.scoreE,
      section_e_enabled: data.sectionEEnabled,
      support_level: data.supportLevel,
      total_score: data.totalScore,
      raw_score: data.rawScore,
      max_possible: data.maxPossible,
      classification: data.classification,
      pdc_percentage: data.pdcPercentage,
      pdc_days_covered: data.pdcDaysCovered,
      pdc_days_observed: data.pdcDaysObserved,
      answers: data.answers as Prisma.InputJsonValue,
      criticalities: data.criticalities as Prisma.InputJsonValue,
      interventions: data.interventions as Prisma.InputJsonValue,
    },
    include: { user: { select: { name: true } } },
  });
  return serialize(assessment as unknown as Record<string, unknown>);
}

export async function getAssessment(id: string) {
  const assessment = await prisma.sivatAssessment.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!assessment) return null;
  return serialize(assessment as unknown as Record<string, unknown>);
}

export async function listAssessments(filters: ListFilters) {
  const where: Prisma.SivatAssessmentWhereInput = {};
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;

  if (filters.userId) where.user_id = filters.userId;
  if (filters.classification) where.classification = filters.classification;
  if (filters.patientName) {
    where.patient_name = { contains: filters.patientName, mode: "insensitive" };
  }
  if (filters.dateFrom || filters.dateTo) {
    where.created_at = {};
    if (filters.dateFrom) where.created_at.gte = filters.dateFrom;
    if (filters.dateTo) where.created_at.lte = filters.dateTo;
  }

  const [assessments, total] = await Promise.all([
    prisma.sivatAssessment.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sivatAssessment.count({ where }),
  ]);

  return {
    assessments: assessments.map((a) => serialize(a as unknown as Record<string, unknown>)),
    total,
  };
}

export async function deleteAssessment(id: string) {
  return prisma.sivatAssessment.delete({ where: { id } });
}

export async function getPatientHistory(patientName: string) {
  const assessments = await prisma.sivatAssessment.findMany({
    where: { patient_name: { equals: patientName, mode: "insensitive" } },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
  });
  return assessments.map((a) => serialize(a as unknown as Record<string, unknown>));
}

// ── Dashboard Stats ──

export async function getDashboardStats(dateFrom?: Date, dateTo?: Date) {
  const where: Prisma.SivatAssessmentWhereInput = {};
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = dateFrom;
    if (dateTo) where.created_at.lte = dateTo;
  }

  // Total count and averages
  const [totalCount, aggregates, classGroups, supportGroups, sectionECount, monthlyRaw] =
    await Promise.all([
      prisma.sivatAssessment.count({ where }),
      prisma.sivatAssessment.aggregate({
        where,
        _avg: {
          total_score: true,
          score_a: true,
          score_b: true,
          score_c: true,
          score_d: true,
        },
      }),
      prisma.sivatAssessment.groupBy({
        by: ["classification"],
        where,
        _count: { id: true },
      }),
      prisma.sivatAssessment.groupBy({
        by: ["support_level"],
        where,
        _count: { id: true },
      }),
      prisma.sivatAssessment.count({
        where: { ...where, section_e_enabled: true },
      }),
      // Monthly trend
      prisma.$queryRaw`
        SELECT
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
          COUNT(*)::int as count,
          ROUND(AVG(total_score), 1)::float as avg_score
        FROM "SivatAssessment"
        GROUP BY date_trunc('month', created_at)
        ORDER BY month ASC
      ` as Promise<Array<{ month: string; count: number; avg_score: number }>>,
    ]);

  // Section E average (only where enabled)
  const sectionEAvg = sectionECount > 0
    ? await prisma.sivatAssessment.aggregate({
        where: { ...where, section_e_enabled: true },
        _avg: { score_e: true },
      })
    : null;

  // Classification distribution as record
  const classificationDistribution: Record<string, number> = {};
  for (const g of classGroups) {
    classificationDistribution[g.classification] = g._count.id;
  }

  // Support level distribution
  const supportLevelDistribution: Record<number, number> = {};
  for (const g of supportGroups) {
    if (g.support_level !== null) {
      supportLevelDistribution[g.support_level] = g._count.id;
    }
  }

  // Top criticalities and interventions from JSON arrays
  let topCriticalities: Array<{ text: string; count: number }> = [];
  let topInterventions: Array<{ text: string; count: number }> = [];

  try {
    topCriticalities = await prisma.$queryRaw<Array<{ text: string; count: number }>>`
      SELECT elem::text as text, COUNT(*)::int as count
      FROM "SivatAssessment", jsonb_array_elements_text(criticalities) as elem
      GROUP BY elem
      ORDER BY count DESC
      LIMIT 10
    `;
    topInterventions = await prisma.$queryRaw<Array<{ text: string; count: number }>>`
      SELECT elem::text as text, COUNT(*)::int as count
      FROM "SivatAssessment", jsonb_array_elements_text(interventions) as elem
      GROUP BY elem
      ORDER BY count DESC
      LIMIT 10
    `;
  } catch {
    // Ignore if no data
  }

  return {
    totalAssessments: totalCount,
    averageScore: aggregates._avg.total_score ?? 0,
    classificationDistribution,
    sectionAverages: {
      a: aggregates._avg.score_a ?? 0,
      b: aggregates._avg.score_b ?? 0,
      c: aggregates._avg.score_c ?? 0,
      d: aggregates._avg.score_d ?? 0,
      e: sectionEAvg?._avg?.score_e ?? null,
    },
    monthlyTrend: monthlyRaw.map((r: { month: string; count: number; avg_score: number }) => ({
      month: r.month,
      count: Number(r.count),
      avgScore: Number(r.avg_score),
    })),
    supportLevelDistribution,
    topCriticalities,
    topInterventions,
    sectionEUsageRate: totalCount > 0 ? Math.round((sectionECount / totalCount) * 100) : 0,
  };
}
