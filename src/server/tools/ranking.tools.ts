import { ToolDecorator as Tool, Widget, ControllerDecorator as Controller, ExecutionContext, z } from '@nitrostack/core';
import { RankingService } from '../services/ranking.service.js';

const hospitalSchema = z.object({
  hospital_id: z.string(),
  hospital_name: z.string(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  capabilities: z.array(z.string()),
  er_beds_available: z.number(),
  icu_beds_available: z.number(),
  estimated_er_wait_minutes: z.number(),
  languages: z.array(z.string()),
  verification_status: z.string(),
  data_type: z.literal('SYNTHETIC_DEMO'),
});

const rankHospitalsSchema = z.object({
  hospitals: z.array(hospitalSchema).min(1).describe('Candidate hospitals to rank, e.g. from get_nearby_hospitals'),
  required_capability: z.string().describe('Required capability/department, e.g. "Trauma Level 1"'),
  origin_latitude: z.number().min(-90).max(90).describe('Latitude of the emergency origin'),
  origin_longitude: z.number().min(-180).max(180).describe('Longitude of the emergency origin'),
});
type RankHospitalsToolInput = z.infer<typeof rankHospitalsSchema>;

@Controller()
export class RankingTools {
  constructor(private readonly rankingService: RankingService) {}

  @Tool({
    name: 'rank_hospitals',
    description:
      'Rank a candidate list of hospitals by specialization match, ICU/ER bed availability, distance, ETA, and estimated wait time. Returns hospitals sorted best-first with the top match flagged as recommended.',
    inputSchema: rankHospitalsSchema,
  })
  @Widget('emergency-dispatch')
  async rankHospitals(input: RankHospitalsToolInput, ctx: ExecutionContext) {
    ctx.logger.info('Ranking hospitals', {
      candidateCount: input.hospitals.length,
      requiredCapability: input.required_capability,
    });

    const { hospitals, weights } = this.rankingService.rank(input);

    return {
      hospitals,
      recommended_hospital_id: hospitals.find((h) => h.is_recommended)?.hospital_id ?? hospitals[0]?.hospital_id ?? null,
      ranking_weights: weights,
    };
  }
}
