import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Guest } from '../../lib/supabase';
import GuestListSummaryWidget from '../GuestListSummaryWidget';

interface DashboardGuestsTabProps {
  guests: Guest[];
  onNavigate: (tab: string) => void;
}

export default function DashboardGuestsTab({ guests, onNavigate }: DashboardGuestsTabProps) {
  const acceptedGuests = guests.filter(g => g.rsvp_status === 'accepted');
  const declinedGuests = guests.filter(g => g.rsvp_status === 'declined');
  const pendingGuests = guests.filter(g => g.rsvp_status === 'invited' || g.rsvp_status === 'planned');

  const guestsWithDietary = guests.filter(g =>
    g.dietary_restrictions && g.dietary_restrictions.length > 0
  );

  const guestsWithoutTable = guests.filter(g =>
    g.rsvp_status === 'accepted' && !g.table_number
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Gäste-Übersicht</h3>
        <p className="text-[#666666] mt-1">Verwalte deine Gästeliste</p>
      </div>

      <GuestListSummaryWidget
        guests={guests}
        onShowAll={() => onNavigate('guests')}
      />

      {guestsWithoutTable.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Gäste ohne Tischzuweisung</h3>
              <p className="text-sm text-[#666666]">{guestsWithoutTable.length} bestätigte Gäste noch ohne Tisch</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {guestsWithoutTable.slice(0, 5).map((guest) => (
              <div key={guest.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-yellow-200">
                <p className="font-medium text-white">{guest.name}</p>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                  Keine Tischnummer
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {guestsWithDietary.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Diätwünsche</h3>
              <p className="text-sm text-[#666666]">{guestsWithDietary.length} Gäste mit besonderen Ernährungswünschen</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {guestsWithDietary.slice(0, 4).map((guest) => (
              <div key={guest.id} className="p-3 bg-white rounded-xl border border-purple-200">
                <p className="font-medium text-white mb-1">{guest.name}</p>
                <p className="text-sm text-[#666666]">{guest.dietary_restrictions}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
