import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import VendorAvatar from '../common/VendorAvatar';

interface AssignedVendor {
  id: string;
  name: string;
  category: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface VendorsTabProps {
  blockId: string;
  onUpdate: () => void;
}

export default function VendorsTab({ blockId }: VendorsTabProps) {
  const [vendors, setVendors] = useState<AssignedVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, [blockId]);

  const loadVendors = async () => {
    try {
      // Load vendor assignments
      const { data: assignments, error: assignError } = await supabase
        .from('vendor_event_assignments')
        .select('vendor_id')
        .eq('timeline_event_id', blockId);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setVendors([]);
        setLoading(false);
        return;
      }

      const vendorIds = assignments.map(a => a.vendor_id);

      // Load vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, category, contact_name, email, phone, address')
        .in('id', vendorIds)
        .order('name', { ascending: true });

      if (vendorError) throw vendorError;
      setVendors(vendorData || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[#0a253c]">Dienstleister</h3>
        <p className="text-sm text-gray-600">
          Verknüpfte Dienstleister für diesen Event-Block
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <Briefcase className="w-4 h-4 inline mr-1" />
          Um Dienstleister zu verknüpfen oder zu entfernen, bearbeiten Sie bitte den Event-Block über den "Bearbeiten"-Button.
        </p>
      </div>

      {/* Vendor Cards */}
      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Noch keine Dienstleister verknüpft</p>
          <p className="text-sm text-gray-500">
            Öffnen Sie das Bearbeitungs-Modal um Dienstleister hinzuzufügen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-lg p-4 border-2 border-gray-200 transition-all hover:shadow-md hover:border-[#d4af37]/30"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <VendorAvatar
                  name={vendor.name}
                  category={vendor.category}
                  size="md"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#0a253c]">{vendor.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{vendor.category}</p>

                  {/* Contact Information */}
                  <div className="space-y-1.5">
                    {vendor.contact_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{vendor.contact_name}</span>
                      </div>
                    )}

                    {vendor.phone && (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="flex items-center gap-2 text-sm text-[#d4af37] hover:text-[#c19a2e]"
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{vendor.phone}</span>
                      </a>
                    )}

                    {vendor.email && (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="flex items-center gap-2 text-sm text-[#d4af37] hover:text-[#c19a2e]"
                      >
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </a>
                    )}

                    {vendor.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{vendor.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
