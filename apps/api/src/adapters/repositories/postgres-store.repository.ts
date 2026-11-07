import type { DatabasePool } from '../../infrastructure/db/pool.js';
import type { IStoreRepository } from '../../use-cases/ports/store.repository.port.js';
import { Store } from '../../domain/entities/store.entity.js';
import { GeoCoordinates } from '../../domain/value-objects/coordinates.vo.js';
import { KazakhstanPhoneNumber } from '../../domain/value-objects/phone-number.vo.js';
import { StoreSchedule } from '../../domain/value-objects/schedule.vo.js';

export class PostgresStoreRepository implements IStoreRepository {
  private readonly db: DatabasePool;

  constructor(db: DatabasePool) {
    this.db = db;
  }

  public async findAll(options?: { district?: string; activeOnly?: boolean }): Promise<Store[]> {
    let query = 'SELECT * FROM public.stores WHERE 1=1';
    const params: any[] = [];

    if (options?.activeOnly !== false) {
      query += ' AND is_active = true';
    }
    if (options?.district) {
      params.push(options.district);
      query += ` AND (district_ru = $${params.length} OR district_kz = $${params.length})`;
    }
    query += ' ORDER BY name_ru ASC';

    const result = await this.db.query(query, params);
    return result.rows.map((r: any) => this.mapRowToEntity(r));
  }

  public async findById(id: string): Promise<Store | null> {
    const result = await this.db.query('SELECT * FROM public.stores WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  public async findBySlug(slug: string): Promise<Store | null> {
    const result = await this.db.query('SELECT * FROM public.stores WHERE slug = $1', [slug]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  private mapRowToEntity(row: any): Store {
    let phoneVO: KazakhstanPhoneNumber;
    try {
      phoneVO = KazakhstanPhoneNumber.from(row.phone);
    } catch {
      phoneVO = new KazakhstanPhoneNumber('+77272322501');
    }

    const lat = parseFloat(row.latitude);
    const lng = parseFloat(row.longitude);

    return new Store(
      row.id,
      row.slug,
      row.name_ru,
      row.name_kz,
      row.district_ru || '',
      row.district_kz || '',
      row.address_ru,
      row.address_kz,
      new GeoCoordinates(lat, lng),
      phoneVO,
      row.email || null,
      new StoreSchedule(
        StoreSchedule.defaultAlmatyDaily().days,
        row.open_hours_ru || row.schedule_ru || 'Ежедневно с 10:00 до 22:00',
        row.open_hours_kz || row.schedule_kz || 'Күн сайын 10:00-ден 22:00-ге дейін'
      ),
      row.image_url || null,
      {
        hasFittingRooms: true,
        hasParking: true,
        acceptsKaspiQr: true,
        hasWheelchairAccess: false,
      },
      Boolean(row.is_active),
      new Date(row.created_at || Date.now()),
      new Date(row.updated_at || Date.now())
    );
  }
}
