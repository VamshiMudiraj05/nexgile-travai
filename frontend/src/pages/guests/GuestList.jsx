import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Mail, Phone, CalendarCheck, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { guestService } from '../../services/guestService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';

export const GuestList = () => {
  const { user } = useAuth();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await guestService.getGuests({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });
      setGuests(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load guests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGuests();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await guestService.deleteGuest(deleteId);
      setDeleteId(null);
      fetchGuests();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete guest profile');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">01 / OPERATIONS &middot; GUEST DIRECTORY</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight">Guest Folio Directory</h1>
          <p className="text-xs text-[#13152C]/70 mt-1">
            Manage VIP guest profiles, contact records, preferences, and historical stay folios.
          </p>
        </div>

        <Link
          to="/guests/new"
          className="btn-luxury-primary self-start inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-[#DFB76C]" />
          <span>Add Guest Profile</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-5 rounded-[4px] shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B88E43]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or telephone..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
          />
        </form>
      </div>

      {/* Guest Table */}
      {loading ? (
        <LoadingSpinner message="Consulting guest folios and VIP registry..." />
      ) : guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guest profiles found"
          description="Create a guest profile to initiate reservations and personalised hospitality services."
          action={
            <Link
              to="/guests/new"
              className="btn-luxury-gold inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-[#13152C]" />
              <span>Create Guest Profile</span>
            </Link>
          }
        />
      ) : (
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] border-b border-[#DFB76C]/30 text-[#13152C]/70">
                <tr>
                  <th className="py-4 px-6 eyebrow-label">Guest Details</th>
                  <th className="py-4 px-4 eyebrow-label">Communication</th>
                  <th className="py-4 px-4 eyebrow-label">Nationality</th>
                  <th className="py-4 px-4 eyebrow-label">Stay History</th>
                  <th className="py-4 px-6 text-right eyebrow-label">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5DA]/60">
                {guests.map((guest) => {
                  const gId = guest.id || guest._id;
                  return (
                    <tr key={gId} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[3px] bg-[#13152C] border border-[#DFB76C]/40 flex items-center justify-center font-editorial font-bold text-[#F2D59B]">
                            {guest.first_name?.[0]?.toUpperCase()}{guest.last_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to={`/guests/${gId}`}
                              className="font-editorial text-base font-bold text-[#13152C] hover:text-[#B88E43] transition-colors block"
                            >
                              {guest.first_name} {guest.last_name}
                            </Link>
                            <span className="text-[11px] text-[#13152C]/60">{guest.city || 'Location unspecified'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-[#13152C]/80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#B88E43]" />
                            <span>{guest.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#13152C]/60">
                            <Phone className="w-3.5 h-3.5 text-[#B88E43]/60" />
                            <span>{guest.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-[#13152C]/80">
                        {guest.nationality || 'International'}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#FAF6F0] border border-[#DFB76C]/30 text-xs font-cinzel text-[#13152C]">
                          <CalendarCheck className="w-3.5 h-3.5 text-[#B88E43]" />
                          <span>{guest.total_bookings || 0} Stays</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/guests/${gId}`}
                            className="p-1.5 rounded-[3px] border border-[#DFB76C]/30 text-[#13152C]/70 hover:text-[#13152C] hover:bg-[#FAF6F0] transition-colors"
                            title="View Profile"
                          >
                            <ExternalLink className="w-4 h-4 text-[#B88E43]" />
                          </Link>

                          <Link
                            to={`/guests/${gId}/edit`}
                            className="p-1.5 rounded-[3px] border border-[#DFB76C]/30 text-[#13152C]/70 hover:text-[#13152C] hover:bg-[#FAF6F0] transition-colors"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-4 h-4 text-[#B88E43]" />
                          </Link>

                          {isAdmin && (
                            <button
                              onClick={() => setDeleteId(gId)}
                              className="p-1.5 rounded-[3px] border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 border-t border-[#DFB76C]/20 bg-[#FAF6F0]/40">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={15}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Archive Guest Profile"
        message="Are you certain you wish to archive this guest profile? Active or future reservations must not exist."
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
