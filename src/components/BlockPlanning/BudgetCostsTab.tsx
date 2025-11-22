import { useState, useEffect } from 'react';
import { DollarSign, Building2, Receipt, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BudgetItem, VendorEventAssignment, Vendor } from '../../lib/supabase';

interface BudgetCostsTabProps {
  eventId: string;
  weddingId: string;
}

interface VendorWithAssignment extends Vendor {
  assignment: VendorEventAssignment;
}

export default function BudgetCostsTab({ eventId, weddingId }: BudgetCostsTabProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [vendors, setVendors] = useState<VendorWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId, weddingId]);

  const loadData = async () => {
    setLoading(true);

    const [budgetRes, assignmentsRes] = await Promise.all([
      supabase
        .from('budget_items')
        .select('*')
        .eq('timeline_event_id', eventId),
      supabase
        .from('vendor_event_assignments')
        .select('*')
        .eq('timeline_event_id', eventId)
    ]);

    if (budgetRes.data) {
      setBudgetItems(budgetRes.data);
    }

    if (assignmentsRes.data) {
      const vendorIds = assignmentsRes.data.map(a => a.vendor_id);
      if (vendorIds.length > 0) {
        const { data: vendorsData } = await supabase
          .from('vendors')
          .select('*')
          .in('id', vendorIds);

        if (vendorsData) {
          const vendorsWithAssignments = vendorsData.map(vendor => {
            const assignment = assignmentsRes.data.find(a => a.vendor_id === vendor.id);
            return { ...vendor, assignment: assignment! };
          });
          setVendors(vendorsWithAssignments);
        }
      }
    }

    setLoading(false);
  };

  const handleNavigateToBudget = () => {
    window.location.hash = `budget-event-${eventId}`;
  };

  const handleNavigateToVendors = () => {
    window.location.hash = `vendors-event-${eventId}`;
  };

  const totalBudgetCost = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  const totalVendorCost = vendors.reduce((sum, v) => sum + (v.assignment?.allocated_cost || 0), 0);
  const totalCost = totalBudgetCost + totalVendorCost;

  const paidBudgetItems = budgetItems.filter(item => item.paid).length;
  const paidBudgetCost = budgetItems.filter(item => item.paid).reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Budget-Kosten</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {totalBudgetCost.toLocaleString('de-DE')} €
          </p>
          <p className="text-sm text-gray-600">{budgetItems.length} Positionen</p>
          {budgetItems.length > 0 && (
            <button
              onClick={handleNavigateToBudget}
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Zum Budget-Manager
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border-2 border-cyan-200">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-cyan-600" />
            <h3 className="font-semibold text-gray-900">Dienstleister</h3>
          </div>
          <p className="text-3xl font-bold text-cyan-600 mb-1">
            {totalVendorCost.toLocaleString('de-DE')} €
          </p>
          <p className="text-sm text-gray-600">{vendors.length} Dienstleister</p>
          {vendors.length > 0 && (
            <button
              onClick={handleNavigateToVendors}
              className="mt-3 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Zum Vendor-Manager
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold text-gray-900">Gesamtkosten</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {totalCost.toLocaleString('de-DE')} €
          </p>
          <p className="text-sm text-gray-600">
            {budgetItems.length + vendors.length} Einträge
          </p>
        </div>
      </div>

      {budgetItems.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b-2 border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Budget-Posten</h3>
              <span className="text-sm text-gray-600">
                {paidBudgetItems}/{budgetItems.length} bezahlt
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {budgetItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.item_name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600">
                      {item.actual_cost.toLocaleString('de-DE')} €
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                        item.paid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {item.paid
                        ? 'Bezahlt'
                        : 'Geplant'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {paidBudgetCost > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Bereits bezahlt:</span>
                <span className="text-lg font-bold text-green-600">
                  {paidBudgetCost.toLocaleString('de-DE')} €
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {vendors.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 px-6 py-4 border-b-2 border-cyan-200">
            <h3 className="font-semibold text-gray-900 text-lg">Zugeordnete Dienstleister</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                    <p className="text-sm text-gray-600">{vendor.category}</p>
                    {vendor.assignment.cost_allocation_percentage < 100 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {vendor.assignment.cost_allocation_percentage.toFixed(1)}% der Gesamtkosten zugewiesen
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-cyan-600">
                      {vendor.assignment.allocated_cost.toLocaleString('de-DE')} €
                    </p>
                    {vendor.total_cost && vendor.total_cost > vendor.assignment.allocated_cost && (
                      <p className="text-xs text-gray-500 mt-1">
                        von {vendor.total_cost.toLocaleString('de-DE')} € gesamt
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {budgetItems.length === 0 && vendors.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Diesem Event sind noch keine Kosten zugeordnet</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleNavigateToBudget}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Budget-Posten hinzufügen
            </button>
            <button
              onClick={handleNavigateToVendors}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
            >
              Dienstleister zuweisen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
