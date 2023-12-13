import { type Document, type Model } from 'mongoose';
import { type PaginationResult } from './interfaces/pagination';
import { type AggregationPaginationLogic, type AggregationPaginationParams } from './interfaces/pagination-aggregate';

/* eslint-disable-line */
export class MongooseAggregationPaginationLogic<T extends Document> implements AggregationPaginationLogic<T> {
  constructor(private readonly model: Model<T>) {}

  async aggregatePaginate(params: AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    const { match, group, sort, limit, next, prev } = params;

    const aggregationPipeline: any[] = [];

    // Etapa de Match
    if (match !== undefined) {
      aggregationPipeline.push({ $match: match });
    }

    // Etapa de Sort para manejar el cursor de paginación (next/prev)
    if (prev !== undefined || next !== undefined) {
      if (sort === undefined) {
        aggregationPipeline.push({ $sort: { _id: 1 } });
      } else {
        aggregationPipeline.push({ $sort: { ...sort } });
      }
    }

    // Aplicar cursor de paginación
    if (prev !== undefined) {
      aggregationPipeline.push({ $match: { _id: { $lt: prev } } });
    } else if (next !== undefined) {
      // aggregationPipeline.push({ $match: { _id: { $gt: next } } })
      aggregationPipeline.push({ $match: { category: { $gt: next } } });
    }

    // Agregar etapas adicionales si es necesario
    if (group !== undefined) {
      aggregationPipeline.push({ $group: group });
    }

    // Limitar los resultados
    aggregationPipeline.push({ $limit: limit + 1 }); // Obtenemos un documento adicional para verificar si hay una página siguiente

    const results = await this.model.aggregate(aggregationPipeline);

    // Determinar si hay una página siguiente/anterior
    const hasNext = results.length > limit;
    const hasPrev = prev != null; // Esto puede ser más complejo dependiendo de cómo manejes el cursor de 'prev'

    // Si hay una página siguiente, eliminar el último elemento
    if (hasNext) {
      results.pop();
    }

    return {
      data: results,
      next: hasNext ? results[results.length - 1]._id : undefined,
      prev: hasPrev ? results[0]._id : undefined,
      hasNext,
      hasPrevious: hasPrev,
      limit,
    };
  }
}
