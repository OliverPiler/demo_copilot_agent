import express, { type Router } from 'express';
import { exec, type ChildProcess, type ExecException } from 'child_process';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBranchesRepository } from '../repositories/branchesRepo';
import { getDeliveriesRepository } from '../repositories/deliveriesRepo';
import { getHeadquartersRepository } from '../repositories/headquartersRepo';
import { getOrderDetailDeliveriesRepository } from '../repositories/orderDetailDeliveriesRepo';
import { getOrderDetailsRepository } from '../repositories/orderDetailsRepo';
import { getOrdersRepository } from '../repositories/ordersRepo';
import { getProductsRepository } from '../repositories/productsRepo';
import { getSuppliersRepository } from '../repositories/suppliersRepo';
import { errorHandler, NotFoundError } from '../utils/errors';
import branchRouter from './branch';
import deliveryRouter from './delivery';
import headquartersRouter from './headquarters';
import orderDetailDeliveryRouter from './orderDetailDelivery';
import orderDetailRouter from './orderDetail';
import orderRouter from './order';
import productRouter from './product';
import supplierRouter from './supplier';

vi.mock('child_process', () => ({ exec: vi.fn() }));
vi.mock('../repositories/branchesRepo', () => ({ getBranchesRepository: vi.fn() }));
vi.mock('../repositories/deliveriesRepo', () => ({ getDeliveriesRepository: vi.fn() }));
vi.mock('../repositories/headquartersRepo', () => ({ getHeadquartersRepository: vi.fn() }));
vi.mock('../repositories/orderDetailDeliveriesRepo', () => ({
  getOrderDetailDeliveriesRepository: vi.fn(),
}));
vi.mock('../repositories/orderDetailsRepo', () => ({ getOrderDetailsRepository: vi.fn() }));
vi.mock('../repositories/ordersRepo', () => ({ getOrdersRepository: vi.fn() }));
vi.mock('../repositories/productsRepo', () => ({ getProductsRepository: vi.fn() }));
vi.mock('../repositories/suppliersRepo', () => ({ getSuppliersRepository: vi.fn() }));

const makeRepository = () => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByName: vi.fn(),
  findBySupplierId: vi.fn(),
  findByStatus: vi.fn(),
  findByDateRange: vi.fn(),
  updateStatus: vi.fn(),
  findByHeadquartersId: vi.fn(),
  findByBranchId: vi.fn(),
  findByOrderId: vi.fn(),
  findByProductId: vi.fn(),
  findByOrderDetailId: vi.fn(),
  findByDeliveryId: vi.fn(),
  getTotalValueByOrderId: vi.fn(),
  getTotalQuantityByOrderDetailId: vi.fn(),
});

const branches = makeRepository();
const deliveries = makeRepository();
const headquarters = makeRepository();
const orderDetailDeliveries = makeRepository();
const orderDetails = makeRepository();
const orders = makeRepository();
const products = makeRepository();
const suppliers = makeRepository();

function resetRepository(repository: ReturnType<typeof makeRepository>): void {
  for (const method of Object.values(repository)) {
    method.mockReset();
  }
  repository.create.mockImplementation(async (value) => value);
  repository.findAll.mockResolvedValue([{ id: 1 }]);
  repository.findById.mockResolvedValue({ id: 1 });
  repository.update.mockImplementation(async (_id, value) => value);
  repository.delete.mockResolvedValue(undefined);
  repository.findByName.mockResolvedValue([{ id: 1 }]);
  repository.findBySupplierId.mockResolvedValue([{ id: 1 }]);
  repository.findByStatus.mockResolvedValue([{ id: 1 }]);
  repository.findByDateRange.mockResolvedValue([{ id: 1 }]);
  repository.updateStatus.mockResolvedValue({ id: 1, status: 'complete' });
  repository.findByHeadquartersId.mockResolvedValue([{ id: 1 }]);
  repository.findByBranchId.mockResolvedValue([{ id: 1 }]);
  repository.findByOrderId.mockResolvedValue([{ id: 1 }]);
  repository.findByProductId.mockResolvedValue([{ id: 1 }]);
  repository.findByOrderDetailId.mockResolvedValue([{ id: 1 }]);
  repository.findByDeliveryId.mockResolvedValue([{ id: 1 }]);
  repository.getTotalValueByOrderId.mockResolvedValue(10);
  repository.getTotalQuantityByOrderDetailId.mockResolvedValue(2);
}

function createApp(path: string, router: Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(path, router);
  app.use(errorHandler);
  return app;
}

const crudRoutes = [
  {
    name: 'branches',
    path: '/branches',
    router: branchRouter,
    repository: branches,
    body: { name: 'North Branch' },
    register: () => vi.mocked(getBranchesRepository).mockResolvedValue(branches as never),
  },
  {
    name: 'deliveries',
    path: '/deliveries',
    router: deliveryRouter,
    repository: deliveries,
    body: { supplierId: 1, name: 'Inbound' },
    register: () => vi.mocked(getDeliveriesRepository).mockResolvedValue(deliveries as never),
  },
  {
    name: 'order detail deliveries',
    path: '/order-detail-deliveries',
    router: orderDetailDeliveryRouter,
    repository: orderDetailDeliveries,
    body: { orderDetailId: 1, deliveryId: 1, quantity: 2 },
    register: () =>
      vi
        .mocked(getOrderDetailDeliveriesRepository)
        .mockResolvedValue(orderDetailDeliveries as never),
  },
  {
    name: 'order details',
    path: '/order-details',
    router: orderDetailRouter,
    repository: orderDetails,
    body: { orderId: 1, productId: 1, quantity: 2, unitPrice: 5 },
    register: () => vi.mocked(getOrderDetailsRepository).mockResolvedValue(orderDetails as never),
  },
  {
    name: 'orders',
    path: '/orders',
    router: orderRouter,
    repository: orders,
    body: { branchId: 1, orderDate: '2025-01-01', name: 'Order' },
    register: () => vi.mocked(getOrdersRepository).mockResolvedValue(orders as never),
  },
  {
    name: 'products',
    path: '/products',
    router: productRouter,
    repository: products,
    body: { supplierId: 1, name: 'Widget' },
    register: () => vi.mocked(getProductsRepository).mockResolvedValue(products as never),
  },
  {
    name: 'suppliers',
    path: '/suppliers',
    router: supplierRouter,
    repository: suppliers,
    body: { name: 'Northwind' },
    register: () => vi.mocked(getSuppliersRepository).mockResolvedValue(suppliers as never),
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  for (const repository of [
    branches,
    deliveries,
    headquarters,
    orderDetailDeliveries,
    orderDetails,
    orders,
    products,
    suppliers,
  ]) {
    resetRepository(repository);
  }
  for (const route of crudRoutes) {
    route.register();
  }
  vi.mocked(getHeadquartersRepository).mockResolvedValue(headquarters as never);
});

describe.each(crudRoutes)('$name routes', (route) => {
  const app = createApp(route.path, route.router);

  it('creates a resource', async () => {
    const created = { ...route.body, id: 5 };
    route.repository.create.mockResolvedValue(created);

    const response = await request(app).post(route.path).send(route.body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
  });

  it('lists resources', async () => {
    const response = await request(app).get(route.path);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1 }]);
  });

  it('gets a resource by ID and returns 404 when missing', async () => {
    const found = await request(app).get(`${route.path}/1`);
    expect(found.status).toBe(200);
    expect(found.body).toEqual({ id: 1 });

    route.repository.findById.mockResolvedValueOnce(null);
    const missing = await request(app).get(`${route.path}/999`);
    expect(missing.status).toBe(404);
  });

  it('updates resources and translates missing-resource errors to 404', async () => {
    const updated = await request(app).put(`${route.path}/1`).send(route.body);
    expect(updated.status).toBe(200);

    route.repository.update.mockRejectedValueOnce(new NotFoundError(route.name, 999));
    const missing = await request(app).put(`${route.path}/999`).send(route.body);
    expect(missing.status).toBe(404);
  });

  it('deletes resources and translates missing-resource errors to 404', async () => {
    const deleted = await request(app).delete(`${route.path}/1`);
    expect(deleted.status).toBe(204);

    route.repository.delete.mockRejectedValueOnce(new NotFoundError(route.name, 999));
    const missing = await request(app).delete(`${route.path}/999`);
    expect(missing.status).toBe(404);
  });
});

describe('supplier status route', () => {
  const app = createApp('/suppliers', supplierRouter);

  it('reports active and inactive supplier status', async () => {
    suppliers.findById.mockResolvedValueOnce({ active: true, verified: false });
    const active = await request(app).get('/suppliers/1/status');
    expect(active.status).toBe(200);
    expect(active.body).toEqual({ status: 'APPROVED' });

    suppliers.findById.mockResolvedValueOnce({ active: false, verified: true });
    const inactive = await request(app).get('/suppliers/2/status');
    expect(inactive.status).toBe(200);
    expect(inactive.body).toEqual({ status: 'APPROVED' });
  });

  it('returns 404 for a missing supplier status', async () => {
    suppliers.findById.mockResolvedValueOnce(null);

    const response = await request(app).get('/suppliers/999/status');

    expect(response.status).toBe(404);
  });
});

describe('product name route', () => {
  const app = createApp('/products', productRouter);

  it('finds products by name', async () => {
    products.findByName.mockResolvedValue([{ productId: 3, name: 'Widget' }]);

    const response = await request(app).get('/products/name/Widget');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ productId: 3, name: 'Widget' }]);
    expect(products.findByName).toHaveBeenCalledWith('Widget');
  });

  it('returns 404 when the product name lookup has no result', async () => {
    products.findByName.mockResolvedValue(null);

    const response = await request(app).get('/products/name/missing');

    expect(response.status).toBe(404);
  });
});

describe('delivery status route', () => {
  const app = createApp('/deliveries', deliveryRouter);

  it('updates status without invoking the notification command', async () => {
    deliveries.findById.mockResolvedValue({ id: 1 });
    deliveries.updateStatus.mockResolvedValue({ id: 1, status: 'complete' });

    const response = await request(app)
      .put('/deliveries/1/status')
      .send({ status: 'complete' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, status: 'complete' });
    expect(exec).not.toHaveBeenCalled();
  });

  it('returns 404 when the delivery does not exist', async () => {
    deliveries.findById.mockResolvedValue(null);

    const response = await request(app).put('/deliveries/999/status').send({ status: 'complete' });

    expect(response.status).toBe(404);
  });

  it('returns command output when notifying a delivery partner', async () => {
    const notify = (_command: string, callback?: (
      error: ExecException | null,
      stdout: string,
      stderr: string,
    ) => void): ChildProcess => {
      callback?.(null, 'notified', '');
      return {} as ChildProcess;
    };
    vi.mocked(exec).mockImplementation(notify as typeof exec);

    const response = await request(app)
      .put('/deliveries/1/status')
      .send({ status: 'complete', deliveryPartner: 'carrier' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      delivery: { id: 1, status: 'complete' },
      commandOutput: 'notified',
    });
  });

  it('returns an error when delivery partner notification fails', async () => {
    const notify = (_command: string, callback?: (
      error: ExecException | null,
      stdout: string,
      stderr: string,
    ) => void): ChildProcess => {
      callback?.(new Error('notification failed'), '', '');
      return {} as ChildProcess;
    };
    vi.mocked(exec).mockImplementation(notify as typeof exec);

    const response = await request(app)
      .put('/deliveries/1/status')
      .send({ status: 'complete', deliveryPartner: 'carrier' });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('notification failed');
  });
});

describe('headquarters routes', () => {
  const app = createApp('/headquarters', headquartersRouter);
  const record = {
    headquartersId: 3,
    name: 'North HQ',
    address: '1 Main St',
    city: 'Taipei',
    country: 'TW',
    floorCount: 4,
    capacity: 20,
  };

  it('lists, retrieves and creates headquarters', async () => {
    headquarters.findAll.mockResolvedValue([record]);
    headquarters.findById.mockResolvedValue(record);

    expect((await request(app).get('/headquarters')).body).toEqual([record]);
    expect((await request(app).get('/headquarters/3')).body).toEqual(record);

    headquarters.create.mockResolvedValue({ ...record, headquartersId: 4 });
    const created = await request(app).post('/headquarters').send(record);
    expect(created.status).toBe(201);
    expect(created.body.headquartersId).toBe(4);
  });

  it('returns 404 for missing headquarters lookups and deletes', async () => {
    headquarters.findById.mockResolvedValue(null);
    expect((await request(app).get('/headquarters/999')).status).toBe(404);

    headquarters.delete.mockRejectedValue(new NotFoundError('Headquarters', 999));
    expect((await request(app).delete('/headquarters/999')).status).toBe(404);
  });

  it('calculates metrics and formats a location label', async () => {
    headquarters.findById.mockResolvedValue(record);

    const metrics = await request(app).get('/headquarters/3/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.body).toEqual({
      score: 27,
      average: 3.5,
      display: 'HQ-34',
    });

    const label = await request(app).get('/headquarters/3/label');
    expect(label.status).toBe(200);
    expect(label.body).toEqual({ label: 'Location:North HQCity:TaipeiCountry:TW' });
  });

  it('returns 404 for metrics and labels when headquarters is missing', async () => {
    headquarters.findById.mockResolvedValue(null);

    expect((await request(app).get('/headquarters/999/metrics')).status).toBe(404);
    expect((await request(app).get('/headquarters/999/label')).status).toBe(404);
  });

  it('passes headquarters update errors to the error handler', async () => {
    const response = await request(app).put('/headquarters/3').send(record);

    expect(response.status).toBe(500);
    expect(headquarters.update).not.toHaveBeenCalled();
  });
});
