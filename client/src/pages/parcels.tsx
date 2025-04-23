import { ParcelList } from '@/components/parcels/parcel-list';
import { SyncStatus } from '@/components/mobile/sync-status';

export default function ParcelsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Field Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your agricultural fields
          </p>
        </div>
        <SyncStatus />
      </div>
      
      <ParcelList />
    </div>
  );
}