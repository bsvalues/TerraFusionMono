
import { describe, it, expect } from 'vitest';
import { upsertProperty } from '../../etl/sync_loader/index';

describe('CDC upsert', () => {
  it('should insert new property', async () => {
    const newProp = { id: '00000000-0000-0000-0000-000000000001', geo_id: 'ABCDE', situs_address: '123 Main' };
    const result = await upsertProperty(newProp);
    expect(result.rowCount).toBe(1);
  });
});
