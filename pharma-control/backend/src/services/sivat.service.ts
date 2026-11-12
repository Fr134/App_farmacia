import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

// ── Types ──

export class SivatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SivatValidationError";
  }
}

export interface PatientInput {
  id?: string | null;
  fullName: string;
  birthDate?: string | null; // YYYY-MM-DD
  phone?: string | null;
  fiscalCode?: string | null;
  notes?: string | null;
}

export interface CreateSivatInput {
  patient: PatientInput;
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
  answers: Record<string, number | string | boolean | Record<string, string | number | boolean | null> | null>;
  criticalities: string[];
  interventions: string[];
}

export interface ListFilters {
  userId?: string;
  pharmacyId?: string;
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
    patientId: assessment.patient_id ?? null,
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

// ── Patients (anagrafica) ──

type PatientRow = {
  id: string;
  full_name: string;
  birth_date: Date | null;
  phone: string | null;
  fiscal_code: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

function serializePatient(p: PatientRow, extra?: { assessmentCount?: number; lastAssessmentAt?: Date | null }) {
  return {
    id: p.id,
    fullName: p.full_name,
    birthDate: p.birth_date ? p.birth_date.toISOString().slice(0, 10) : null,
    phone: p.phone,
    fiscalCode: p.fiscal_code,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    assessmentCount: extra?.assessmentCount ?? 0,
    lastAssessmentAt: extra?.lastAssessmentAt ?? null,
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function normalizePatientData(input: PatientInput) {
  const fullName = input.fullName.trim();
  if (!fullName) throw new SivatValidationError("Nome e cognome obbligatori");
  const birth = emptyToNull(input.birthDate);
  return {
    full_name: fullName,
    birth_date: birth ? new Date(`${birth}T00:00:00.000Z`) : null,
    phone: emptyToNull(input.phone),
    fiscal_code: emptyToNull(input.fiscalCode)?.toUpperCase() ?? null,
    notes: emptyToNull(input.notes),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function listPatients(pharmacyId: string, search?: string) {
  const where: Prisma.SivatPatientWhereInput = { pharmacy_id: pharmacyId };
  const q = search?.trim();
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { fiscal_code: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const patients = await prisma.sivatPatient.findMany({
    where,
    include: {
      _count: { select: { assessments: true } },
      assessments: { select: { created_at: true }, orderBy: { created_at: "desc" }, take: 1 },
    },
    orderBy: { updated_at: "desc" },
    take: 50,
  });

  return patients.map((p) =>
    serializePatient(p, {
      assessmentCount: p._count.assessments,
      lastAssessmentAt: p.assessments[0]?.created_at ?? null,
    })
  );
}

export async function getPatientWithLatestAssessment(patientId: string, pharmacyId: string) {
  const patient = await prisma.sivatPatient.findFirst({
    where: { id: patientId, pharmacy_id: pharmacyId },
    include: { _count: { select: { assessments: true } } },
  });
  if (!patient) return null;

  const latest = await prisma.sivatAssessment.findFirst({
    where: { patient_id: patientId, pharmacy_id: pharmacyId },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
  });

  return {
    patient: serializePatient(patient, {
      assessmentCount: patient._count.assessments,
      lastAssessmentAt: latest?.created_at ?? null,
    }),
    latestAssessment: latest ? serialize(latest as unknown as Record<string, unknown>) : null,
  };
}

export async function updatePatient(patientId: string, input: PatientInput, pharmacyId: string) {
  const existing = await prisma.sivatPatient.findFirst({ where: { id: patientId, pharmacy_id: pharmacyId } });
  if (!existing) throw new SivatValidationError("Cliente non trovato");
  try {
    const updated = await prisma.sivatPatient.update({
      where: { id: patientId },
      data: normalizePatientData(input),
    });
    return serializePatient(updated);
  } catch (err) {
    if (isUniqueViolation(err)) throw new SivatValidationError("Esiste già un cliente con questo codice fiscale");
    throw err;
  }
}

// ── CRUD ──

export async function createAssessment(data: CreateSivatInput, userId: string, pharmacyId: string) {
  const patientData = normalizePatientData(data.patient);

  // Upsert patient + create assessment atomically
  try {
    return await prisma.$transaction(async (tx) => {
      let patientId: string;
      if (data.patient.id) {
        const existing = await tx.sivatPatient.findFirst({
          where: { id: data.patient.id, pharmacy_id: pharmacyId },
        });
        if (!existing) throw new SivatValidationError("Cliente non trovato");
        await tx.sivatPatient.update({ where: { id: existing.id }, data: patientData });
        patientId = existing.id;
      } else {
        const created = await tx.sivatPatient.create({
          data: { ...patientData, pharmacy_id: pharmacyId },
        });
        patientId = created.id;
      }

      const assessment = await tx.sivatAssessment.create({
        data: buildAssessmentData(data, patientData.full_name, patientId, userId, pharmacyId),
        include: { user: { select: { name: true } } },
      });
      return serialize(assessment as unknown as Record<string, unknown>);
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new SivatValidationError(
        "Esiste già un cliente con questo codice fiscale: selezionalo da \"Cliente registrato\""
      );
    }
    throw err;
  }
}

function buildAssessmentData(
  data: CreateSivatInput,
  patientName: string,
  patientId: string,
  userId: string,
  pharmacyId: string
): Prisma.SivatAssessmentUncheckedCreateInput {
  return {
      user_id: userId,
      pharmacy_id: pharmacyId,
      patient_id: patientId,
      patient_name: patientName,
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
  };
}

export async function getAssessment(id: string, pharmacyId: string) {
  const assessment = await prisma.sivatAssessment.findFirst({
    where: { id, pharmacy_id: pharmacyId },
    include: { user: { select: { name: true } } },
  });
  if (!assessment) return null;
  return serialize(assessment as unknown as Record<string, unknown>);
}

export async function listAssessments(filters: ListFilters) {
  const where: Prisma.SivatAssessmentWhereInput = {};
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;

  if (filters.pharmacyId) where.pharmacy_id = filters.pharmacyId;
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

export async function deleteAssessment(id: string, pharmacyId: string) {
  const assessment = await prisma.sivatAssessment.findFirst({
    where: { id, pharmacy_id: pharmacyId },
  });
  if (!assessment) {
    throw new Error("Valutazione non trovata");
  }
  return prisma.sivatAssessment.delete({ where: { id } });
}

export async function getPatientHistory(patientName: string, pharmacyId: string) {
  const assessments = await prisma.sivatAssessment.findMany({
    where: { patient_name: { equals: patientName, mode: "insensitive" }, pharmacy_id: pharmacyId },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
  });
  return assessments.map((a) => serialize(a as unknown as Record<string, unknown>));
}

// ── Dashboard Stats ──

export async function getDashboardStats(pharmacyId: string, dateFrom?: Date, dateTo?: Date) {
  const where: Prisma.SivatAssessmentWhereInput = { pharmacy_id: pharmacyId };
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
        WHERE pharmacy_id = ${pharmacyId}
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
      WHERE pharmacy_id = ${pharmacyId}
      GROUP BY elem
      ORDER BY count DESC
      LIMIT 10
    `;
    topInterventions = await prisma.$queryRaw<Array<{ text: string; count: number }>>`
      SELECT elem::text as text, COUNT(*)::int as count
      FROM "SivatAssessment", jsonb_array_elements_text(interventions) as elem
      WHERE pharmacy_id = ${pharmacyId}
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
