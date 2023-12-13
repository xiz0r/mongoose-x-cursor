import { type Document, type Model } from 'mongoose';
import { type PaginationResult } from './interfaces/pagination';
import { type AggregationPaginationLogic, type AggregationPaginationParams } from './interfaces/pagination-aggregate';

/* eslint-disable-line */
export class MongooseAggregationPaginationLogic<T extends Document> implements AggregationPaginationLogic<T> {
  constructor(private readonly model: Model<T>) {}

  async aggregatePaginate(params: AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    const { match, group, sort, limit, next } = params;

    const aggregationPipeline: any[] = [];

    // Etapa de Match
    if (match !== undefined) {
      aggregationPipeline.push({ $match: match });
    }

    // Etapa de Sort
    if (sort !== undefined) {
      aggregationPipeline.push({ $sort: { category: 1 } });
    }

    // Calcular Offset
    const offset = (parseInt(next ?? '1') - 1) * limit;

    // Aplicar Offset y Limit
    aggregationPipeline.push({ $skip: offset });
    aggregationPipeline.push({ $limit: limit });

    // Agregar etapas adicionales si es necesario
    if (group !== undefined) {
      aggregationPipeline.push({ $group: group });
    }

    const results = await this.model.aggregate(aggregationPipeline);

    // No es necesario determinar si hay una página siguiente/anterior
    // ya que se manejará a nivel de la lógica de la aplicación

    return {
      data: results,
      limit,
      next,
    };
  }
}
