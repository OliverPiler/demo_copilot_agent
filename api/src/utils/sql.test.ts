import { describe, expect, it } from 'vitest';
import {
  SelectQueryBuilder,
  buildInsertSQL,
  buildUpdateSQL,
  generatePlaceholders,
  mapDatabaseRows,
  objectToCamelCase,
  objectToSnakeCase,
  toCamelCase,
  toSnakeCase,
  validateRequiredFields,
} from './sql';

describe('SQL helpers', () => {
  it('builds SELECT clauses and omits unspecified clauses', () => {
    expect(new SelectQueryBuilder('suppliers').build()).toBe('SELECT * FROM suppliers');
    expect(
      new SelectQueryBuilder('products')
        .select(['product_id', 'name'])
        .join('suppliers', 'products.supplier_id = suppliers.supplier_id', 'LEFT')
        .where('active = 1')
        .where('price > 0')
        .orderBy('name')
        .orderBy('product_id', 'DESC')
        .limit(10)
        .offset(20)
        .build(),
    ).toBe(
      'SELECT product_id, name FROM products LEFT JOIN suppliers ON products.supplier_id = suppliers.supplier_id WHERE active = 1 AND price > 0 ORDER BY name ASC, product_id DESC LIMIT 10 OFFSET 20',
    );
  });

  it('converts object keys and maps database rows', () => {
    expect(toSnakeCase('headquartersId')).toBe('headquarters_id');
    expect(toCamelCase('headquarters_id')).toBe('headquartersId');
    expect(objectToSnakeCase({ branchId: 2, name: 'North' })).toEqual({
      branch_id: 2,
      name: 'North',
    });
    expect(objectToCamelCase({ supplier_id: 3, contact_person: 'Ada' })).toEqual({
      supplierId: 3,
      contactPerson: 'Ada',
    });
    expect(mapDatabaseRows([{ order_id: 4 }])).toEqual([{ orderId: 4 }]);
  });

  it('generates placeholders and parameterized insert and update statements', () => {
    expect(generatePlaceholders(3)).toBe('?, ?, ?');
    expect(buildInsertSQL('branches', { headquartersId: 1, name: 'North' })).toEqual({
      sql: 'INSERT INTO branches (headquarters_id, name) VALUES (?, ?)',
      values: [1, 'North'],
    });
    expect(buildUpdateSQL('branches', { headquartersId: 1 }, 'branch_id = ?')).toEqual({
      sql: 'UPDATE branches SET headquarters_id = ? WHERE branch_id = ?',
      values: [1],
    });
  });

  it('validates required fields', () => {
    expect(() => validateRequiredFields({ name: 'North', address: '1 Main St' }, ['name', 'address']))
      .not.toThrow();
    expect(() => validateRequiredFields({ name: '' }, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
    expect(() => validateRequiredFields({ name: null }, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
    expect(() => validateRequiredFields({}, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
  });
});
