import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseConnection } from '../db/sqlite';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { BranchesRepository } from './branchesRepo';
import { DeliveriesRepository } from './deliveriesRepo';
import { HeadquartersRepository } from './headquartersRepo';
import { OrderDetailDeliveriesRepository } from './orderDetailDeliveriesRepo';
import { OrderDetailsRepository } from './orderDetailsRepo';
import { OrdersRepository } from './ordersRepo';
import { ProductsRepository } from './productsRepo';

interface RepositoryAdapter {
  findAll: () => Promise<unknown[]>;
  findById: (id: number) => Promise<unknown | null>;
  create: (data: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, data: Record<string, unknown>) => Promise<unknown>;
  delete: (id: number) => Promise<void>;
  exists: (id: number) => Promise<boolean>;
  findByCriteria: () => Promise<unknown>;
}

interface RepositoryCase {
  name: string;
  row: Record<string, unknown>;
  idColumn: string;
  camelId: string;
  make: (db: DatabaseConnection) => RepositoryAdapter;
}

const repositoryCases: RepositoryCase[] = [
  {
    name: 'branches',
    row: { branch_id: 7, headquarters_id: 2, name: 'North Branch' },
    idColumn: 'branch_id',
    camelId: 'branchId',
    make: (db) => {
      const repo = new BranchesRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: async () => [
          await repo.findByHeadquartersId(2),
          await repo.findByName('North'),
        ],
      };
    },
  },
  {
    name: 'deliveries',
    row: { delivery_id: 7, supplier_id: 2, status: 'pending', delivery_date: '2025-01-01' },
    idColumn: 'delivery_id',
    camelId: 'deliveryId',
    make: (db) => {
      const repo = new DeliveriesRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: async () => [
          await repo.findBySupplierId(2),
          await repo.findByStatus('pending'),
          await repo.findByDateRange('2025-01-01', '2025-01-31'),
          await repo.updateStatus(7, 'complete'),
        ],
      };
    },
  },
  {
    name: 'headquarters',
    row: { headquarters_id: 7, name: 'North HQ' },
    idColumn: 'headquarters_id',
    camelId: 'headquartersId',
    make: (db) => {
      const repo = new HeadquartersRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: () => repo.findByName('North'),
      };
    },
  },
  {
    name: 'order detail deliveries',
    row: { order_detail_delivery_id: 7, order_detail_id: 3, delivery_id: 4, quantity: 2 },
    idColumn: 'order_detail_delivery_id',
    camelId: 'orderDetailDeliveryId',
    make: (db) => {
      const repo = new OrderDetailDeliveriesRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: async () => [
          await repo.findByOrderDetailId(3),
          await repo.findByDeliveryId(4),
          await repo.getTotalQuantityByOrderDetailId(3),
        ],
      };
    },
  },
  {
    name: 'order details',
    row: { order_detail_id: 7, order_id: 3, product_id: 4, quantity: 2, unit_price: 5 },
    idColumn: 'order_detail_id',
    camelId: 'orderDetailId',
    make: (db) => {
      const repo = new OrderDetailsRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: async () => [
          await repo.findByOrderId(3),
          await repo.findByProductId(4),
          await repo.getTotalValueByOrderId(3),
        ],
      };
    },
  },
  {
    name: 'orders',
    row: { order_id: 7, branch_id: 2, name: 'Order', status: 'pending' },
    idColumn: 'order_id',
    camelId: 'orderId',
    make: (db) => {
      const repo = new OrdersRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: async () => [
          await repo.findByBranchId(2),
          await repo.findByStatus('pending'),
          await repo.findByDateRange('2025-01-01', '2025-01-31'),
        ],
      };
    },
  },
  {
    name: 'products',
    row: { product_id: 7, supplier_id: 2, name: 'Widget' },
    idColumn: 'product_id',
    camelId: 'productId',
    make: (db) => {
      const repo = new ProductsRepository(db);
      return {
        findAll: () => repo.findAll(),
        findById: (id) => repo.findById(id),
        create: (data) => repo.create(data as never),
        update: (id, data) => repo.update(id, data as never),
        delete: (id) => repo.delete(id),
        exists: (id) => repo.exists(id),
        findByCriteria: async () => [
          await repo.findBySupplierId(2),
          await repo.findByName('Widget'),
        ],
      };
    },
  },
];

describe.each(repositoryCases)('$name repository', (testCase) => {
  let db: {
    all: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
  };
  let repo: RepositoryAdapter;

  beforeEach(() => {
    db = {
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
    };
    repo = testCase.make(db as unknown as DatabaseConnection);
  });

  it('maps rows returned by findAll', async () => {
    db.all.mockResolvedValue([testCase.row]);

    const result = await repo.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty(testCase.camelId, 7);
  });

  it('maps a found row and returns null when findById misses', async () => {
    db.get.mockResolvedValueOnce(testCase.row).mockResolvedValueOnce(undefined);

    expect(await repo.findById(7)).toHaveProperty(testCase.camelId, 7);
    await expect(repo.findById(8)).resolves.toBeNull();
  });

  it('creates a record and reloads it by the inserted ID', async () => {
    db.run.mockResolvedValue({ lastID: 7, changes: 1 });
    db.get.mockResolvedValue(testCase.row);

    const result = await repo.create({ name: 'Created record' });

    expect(result).toHaveProperty(testCase.camelId, 7);
    expect(db.get).toHaveBeenCalledWith(
      expect.stringContaining(`WHERE ${testCase.idColumn} = ?`),
      [7],
    );
  });

  it('updates a record and rejects updates that affect no rows', async () => {
    db.run.mockResolvedValueOnce({ changes: 1 }).mockResolvedValueOnce({ changes: 0 });
    db.get.mockResolvedValue(testCase.row);

    const result = await repo.update(7, { name: 'Updated record' });
    expect(result).toHaveProperty(testCase.camelId, 7);
    await expect(repo.update(8, { name: 'Missing record' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('deletes a record and rejects deletes that affect no rows', async () => {
    db.run.mockResolvedValueOnce({ changes: 1 }).mockResolvedValueOnce({ changes: 0 });

    await expect(repo.delete(7)).resolves.toBeUndefined();
    await expect(repo.delete(8)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('reports whether a record exists', async () => {
    db.get.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(repo.exists(7)).resolves.toBe(true);
    await expect(repo.exists(8)).resolves.toBe(false);
  });

  it('runs the repository-specific lookup and aggregate queries', async () => {
    db.all.mockResolvedValue([testCase.row]);
    db.get.mockResolvedValue({ total: 10, ...testCase.row });
    db.run.mockResolvedValue({ changes: 1 });

    const result = await repo.findByCriteria();

    expect(result).toBeDefined();
  });

  it('converts database failures from reads, writes and custom queries', async () => {
    db.all.mockRejectedValueOnce(new Error('read failed'));
    await expect(repo.findAll()).rejects.toBeInstanceOf(DatabaseError);

    db.get.mockRejectedValueOnce(new Error('read failed'));
    await expect(repo.findById(7)).rejects.toBeInstanceOf(DatabaseError);

    db.run.mockRejectedValueOnce(new Error('write failed'));
    await expect(repo.create({ name: 'Failed record' })).rejects.toBeInstanceOf(DatabaseError);

    db.get.mockRejectedValueOnce(new Error('read failed'));
    await expect(repo.exists(7)).rejects.toBeInstanceOf(DatabaseError);

    if (testCase.name === 'order details' || testCase.name === 'order detail deliveries') {
      db.all.mockResolvedValue([]);
      db.get.mockRejectedValueOnce(new Error('aggregate failed'));
    } else {
      db.all.mockRejectedValueOnce(new Error('filter failed'));
    }
    await expect(repo.findByCriteria()).rejects.toBeInstanceOf(DatabaseError);
  });
});
