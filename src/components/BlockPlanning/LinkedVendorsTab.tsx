import { useState, useEffect } from 'react';
import { Plus, X, Briefcase, Phone, Mail, AlertCircle, DollarSign, Edit2, Check, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Vendor, VendorEventAssignment } from '../../lib/supabase';

interface LinkedVendorsTabProps {
  eventId: string;
  weddingId: string;
  onUpdate: () => void;
}

interface VendorWithAssignment extends Vendor {
  assignment?: VendorEventAssignment;
  totalAssignments?: number;
}

export default function LinkedVendorsTab({
  eventId,
  weddingId,
  onUpdate,
}: LinkedVendorsTabProps) {
  const [linkedVendors, setLinkedVendors] = useState<VendorWithAssignment[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [editingAllocation, setEditingAllocation] = useState<string | null>(null);
  const [allocationValue, setAllocationValue] = useState<string>('');

  useEffect(() => {
    loadVendors();
  }, [eventId, weddingId]);

  const loadVendors = async () => {
    setLoading(true);

    const [assignmentsRes, vendorsRes] = await Promise.all([
      supabase
        .from('vendor_event_assignments')
        .select('*')
        .eq('timeline_event_id', eventId),
      supabase
        .from('vendors')
        .select('*')
        .eq('wedding_id', weddingId)
    ]);

    if (vendorsRes.data && assignmentsRes.data) {
      const assignedVendorIds = new Set(assignmentsRes.data.map(a => a.vendor_id));

      const linkedVendorsData = await Promise.all(
        assignmentsRes.data.map(async (assignment) => {
          const vendor = vendorsRes.data.find(v => v.id === assignment.vendor_id);
          if (!vendor) return null;

          const { count } = await supabase
            .from('vendor_event_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);

          return {
            ...vendor,
            assignment,
            totalAssignments: count || 0
          };
        })
      );

      setLinkedVendors(linkedVendorsData.filter(v => v !== null) as VendorWithAssignment[]);
      setAvailableVendors(vendorsRes.data.filter(v => !assignedVendorIds.has(v.id)));
    }

    setLoading(false);
  };

  const handleAssignVendors = async () => {
    if (selectedVendorIds.length === 0) return;

    for (const vendorId of selectedVendorIds) {
      const vendor = availableVendors.find(v => v.id === vendorId);
      if (!vendor) continue;

      const { count: existingAssignments } = await supabase
        .from('vendor_event_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      const totalAssignments = (existingAssignments || 0) + 1;
      const allocatedCost = (vendor.total_cost || 0) / totalAssignments;
      const percentage = 100 / totalAssignments;

      await supabase.from('vendor_event_assignments').insert({
        vendor_id: vendorId,
        timeline_event_id: eventId,
        allocated_cost: allocatedCost,
        cost_allocation_percentage: percentage
      });

      await supabase
        .from('vendor_event_assignments')
        .update({
          allocated_cost: allocatedCost,
          cost_allocation_percentage: percentage
        })
        .eq('vendor_id', vendorId);
    }

    setShowAssignModal(false);
    setSelectedVendorIds([]);
    setSearchQuery('');
    loadVendors();
    onUpdate();
  };

  const handleUnassignVendor = async (vendorId: string, assignmentId: string) => {
    const { error } = await supabase
      .from('vendor_event_assignments')
      .delete()
      .eq('id', assignmentId);

    if (!error) {
      const { count: remainingAssignments } = await supabase
        .from('vendor_event_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      if (remainingAssignments && remainingAssignments > 0) {
        const vendor = linkedVendors.find(v => v.id === vendorId);
        if (vendor && vendor.total_cost) {
          const newAllocatedCost = vendor.total_cost / remainingAssignments;
          const newPercentage = 100 / remainingAssignments;

          await supabase
            .from('vendor_event_assignments')
            .update({
              allocated_cost: newAllocatedCost,
              cost_allocation_percentage: newPercentage
            })
            .eq('vendor_id', vendorId);
        }
      }

      loadVendors();
      onUpdate();
    }
  };

  const handleUpdateAllocation = async (assignmentId: string, vendorId: string) => {
    const newCost = parseFloat(allocationValue);
    if (isNaN(newCost) || newCost < 0) return;

    const vendor = linkedVendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.total_cost) return;

    const percentage = (newCost / vendor.total_cost) * 100;

    await supabase
      .from('vendor_event_assignments')
      .update({
        allocated_cost: newCost,
        cost_allocation_percentage: percentage
      })
      .eq('id', assignmentId);

    setEditingAllocation(null);
    setAllocationValue('');
    loadVendors();
    onUpdate();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      inquiry: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      signed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      inquiry: 'Anfrage',
      pending: 'In Verhandlung',
      signed: 'Unterschrieben',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalCost = linkedVendors.reduce((sum, v) => sum + (v.assignment?.allocated_cost || 0), 0);

  const filteredAvailableVendors = availableVendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Verknüpfte Dienstleister</h3>
          <p className="text-sm text-gray-600 mt-1">
            {linkedVendors.length} Dienstleister diesem Event zugeordnet
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Dienstleister zuweisen
        </button>
      </div>

      {linkedVendors.length > 0 && totalCost > 0 && (
        <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Gesamtkosten für dieses Event</span>
          <span className="text-2xl font-bold text-green-600">
            {totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      )}

      {linkedVendors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Noch keine Dienstleister zugeordnet</p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Ersten Dienstleister zuweisen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{vendor.name}</h4>
                  <p className="text-sm text-gray-600">{vendor.category}</p>
                  {vendor.totalAssignments && vendor.totalAssignments > 1 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Zugeordnet zu {vendor.totalAssignments} Events
                    </p>
                  )}
                </div>
                <button
                  onClick={() => vendor.assignment && handleUnassignVendor(vendor.id, vendor.assignment.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Zuordnung entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {getStatusBadge(vendor.contract_status)}

              <div className="mt-3 space-y-2 text-sm">
                {vendor.contact_name && (
                  <p className="text-gray-700">
                    <span className="font-medium">Kontakt:</span> {vendor.contact_name}
                  </p>
                )}
                {vendor.phone && (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="w-4 h-4" />
                    {vendor.email}
                  </a>
                )}
                {vendor.assignment && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 font-medium">Zugewiesene Kosten für dieses Event:</span>
                      {editingAllocation !== vendor.assignment.id && (
                        <button
                          onClick={() => {
                            setEditingAllocation(vendor.assignment!.id);
                            setAllocationValue(vendor.assignment!.allocated_cost.toString());
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Kostenverteilung bearbeiten"
                        >
                          <Edit2 className="w-3 h-3 text-gray-500" />
                        </button>
                      )}
                    </div>
                    {editingAllocation === vendor.assignment.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={allocationValue}
                          onChange={(e) => setAllocationValue(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          step="0.01"
                          min="0"
                        />
                        <button
                          onClick={() => handleUpdateAllocation(vendor.assignment!.id, vendor.id)}
                          className="p-1 bg-green-100 hover:bg-green-200 rounded"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingAllocation(null);
                            setAllocationValue('');
                          }}
                          className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          {vendor.assignment.allocated_cost.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({vendor.assignment.cost_allocation_percentage.toFixed(1)}% von{' '}
                          {vendor.total_cost?.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          })})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Dienstleister zuweisen
                </h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedVendorIds([]);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dienstleister durchsuchen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filteredAvailableVendors.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'Keine Dienstleister gefunden'
                      : 'Alle Dienstleister sind bereits zugeordnet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableVendors.map((vendor) => (
                    <label
                      key={vendor.id}
                      className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(vendor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendorIds([...selectedVendorIds, vendor.id]);
                          } else {
                            setSelectedVendorIds(
                              selectedVendorIds.filter((id) => id !== vendor.id)
                            );
                          }
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-600">{vendor.category}</p>
                        {vendor.total_cost && (
                          <p className="text-sm text-gray-700 mt-1">
                            {vendor.total_cost.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedVendorIds([]);
                    setSearchQuery('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAssignVendors}
                  disabled={selectedVendorIds.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedVendorIds.length} Dienstleister zuweisen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
