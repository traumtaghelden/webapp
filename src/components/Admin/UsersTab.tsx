import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Clock,
  Crown,
  AlertCircle,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UserDetailModal from './UserDetailModal';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  user_role: string;
  wedding_id: string | null;
  trial_ends_at: string | null;
  account_status: string;
}

interface Props {
  globalSearch?: string;
}

type FilterStatus = 'all' | 'trial' | 'premium' | 'expired';
type SortField = 'name' | 'email' | 'created_at' | 'trial_ends_at';
type SortDirection = 'asc' | 'desc';

export default function UsersTab({ globalSearch }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (globalSearch) {
      setSearchTerm(globalSearch);
    }
  }, [globalSearch]);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterStatus, sortField, sortDirection]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          created_at,
          user_role,
          trial_ends_at,
          account_status
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = data.map((user: any) => ({
        id: user.id,
        full_name: user.email,
        email: user.email,
        created_at: user.created_at,
        user_role: user.user_role,
        wedding_id: null,
        trial_ends_at: user.trial_ends_at,
        account_status: user.account_status,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(search) ||
          user.full_name?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((user) => {
        switch (filterStatus) {
          case 'trial':
            return user.account_status === 'trial_active';
          case 'premium':
            return user.account_status === 'premium_active';
          case 'expired':
            return user.account_status === 'trial_expired';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.full_name || '';
          bVal = b.full_name || '';
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'created_at':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        case 'trial_ends_at':
          aVal = a.trial_ends_at ? new Date(a.trial_ends_at) : new Date(0);
          bVal = b.trial_ends_at ? new Date(b.trial_ends_at) : new Date(0);
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (user: User) => {
    const now = new Date();
    const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;

    if (user.account_status === 'premium_active') {
      return (
        <span className="bg-[#F5B800]/20 text-[#F5B800] border border-[#F5B800]/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Premium
        </span>
      );
    }

    if (user.account_status === 'trial_active' && trialEnd) {
      if (trialEnd > now) {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Trial ({daysLeft}d)
          </span>
        );
      }
    }

    if (user.account_status === 'trial_expired') {
      return (
        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-medium">
          Expired
        </span>
      );
    }

    return (
      <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-medium">
        Neu
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'E-Mail', 'Status', 'Trial-Ende', 'Registriert'];
    const rows = filteredUsers.map((user) => {
      let status = 'Neu';

      if (user.account_status === 'premium_active') status = 'Premium';
      else if (user.account_status === 'trial_active') status = 'Trial';
      else if (user.account_status === 'trial_expired') status = 'Expired';

      return [
        user.full_name || '',
        user.email,
        status,
        user.trial_ends_at ? formatDate(user.trial_ends_at) : '-',
        formatDate(user.created_at),
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Lade Users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">User Verwaltung</h2>
          <button
            onClick={exportToCSV}
            className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{users.length}</p>
            <p className="text-sm text-gray-400">Gesamt Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">
              {users.filter((u) => u.account_status === 'trial_active').length}
            </p>
            <p className="text-sm text-gray-400">Aktive Trials</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#F5B800]">
              {users.filter((u) => u.account_status === 'premium_active').length}
            </p>
            <p className="text-sm text-gray-400">Premium</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-400">
              {users.filter((u) => u.account_status === 'trial_expired').length}
            </p>
            <p className="text-sm text-gray-400">Expired</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach E-Mail oder Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
          >
            <option value="all">Alle Status</option>
            <option value="trial">Trial</option>
            <option value="premium">Premium</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('trial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'trial'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Expiring Soon
          </button>

          <button
            onClick={() => setFilterStatus('premium')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'premium'
                ? 'bg-[#F5B800]/20 text-[#F5B800] border border-[#F5B800]/30'
                : 'bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30'
            }`}
          >
            <Crown className="w-4 h-4 inline mr-2" />
            Premium Active
          </button>

          {filterStatus !== 'all' && (
            <button
              onClick={() => {
                setFilterStatus('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-transparent text-gray-400 border border-gray-600 hover:bg-gray-700/30 transition-all"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a3a5c]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    Name
                    {sortField === 'name' && (
                      <span className="text-[#F5B800]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('email')}
                    className="text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    E-Mail
                    {sortField === 'email' && (
                      <span className="text-[#F5B800]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('trial_ends_at')}
                    className="text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    Trial-Ende
                    {sortField === 'trial_ends_at' && (
                      <span className="text-[#F5B800]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    Registriert
                    {sortField === 'created_at' && (
                      <span className="text-[#F5B800]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#1a3a5c]/50 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserDetail(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5B800] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(user.full_name || user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{user.full_name || 'Unbekannt'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4">{getStatusBadge(user)}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {user.trial_ends_at ? formatDate(user.trial_ends_at) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setShowUserDetail(true);
                      }}
                      className="bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium px-4 py-2 rounded-lg transition-all text-sm"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-[#1a3a5c] px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Zeige {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} von{' '}
              {filteredUsers.length} Users
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-[#0A1F3D] hover:bg-[#0A1F3D]/80 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-white font-medium">
                Seite {currentPage} von {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-[#0A1F3D] hover:bg-[#0A1F3D]/80 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-[#0A1F3D]/50 rounded-xl border border-gray-700 p-12 text-center">
          <UserPlus className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-2">Keine Users gefunden</p>
          <p className="text-sm text-gray-500">
            Versuche einen anderen Suchbegriff oder Filter
          </p>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
            loadUsers(); // Reload users after modal close
          }}
        />
      )}
    </div>
  );
}
