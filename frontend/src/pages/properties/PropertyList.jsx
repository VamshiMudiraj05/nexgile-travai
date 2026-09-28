import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Star, 
  BedDouble, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { StatusBadge } from '../../components/StatusBadge';
import { Pagination } from '../../components/Pagination';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';

export const PropertyList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getProperties({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setProperties(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProperties();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await propertyService.deleteProperty(deleteId);
      setDeleteId(null);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-8 md:p-10 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#B88E43]">
              <Sparkles size={14} className="text-[#DFB76C]" /> 01 / PORTFOLIO
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#13152C] font-normal tracking-tight">
              Hospitality Portfolio
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#13152C]/65 max-w-xl leading-relaxed">
              Curate and oversee hotel properties, room category configurations, live unit inventories, and brand standards.
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/properties/new"
              className="btn-luxury-primary text-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Property</span>
            </Link>
          )}
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFFFF] border border-[#DFB76C]/30 p-4 rounded-[4px] shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#DFB76C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hotel name, code, city..."
            className="w-full pl-10 pr-4 py-2 luxury-input text-xs font-sans placeholder-[#13152C]/40"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3.5 py-2 luxury-input text-xs font-semibold bg-[#FAF6F0] cursor-pointer"
          >
            <option value="">All Operational Statuses</option>
            <option value="ACTIVE">Active Portfolio</option>
            <option value="INACTIVE">Archived Portfolio</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner text="Cataloging hotel portfolio registry..." />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hotel properties enrolled"
          description="Begin by registering your first luxury hotel or resort property into the Nexgile portfolio."
          action={
            isAdmin && (
              <Link
                to="/properties/new"
                className="btn-luxury-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register First Property</span>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] font-cinzel text-[9.5px] uppercase font-bold text-[#13152C]/70 border-b border-[#DFB76C]/25 tracking-[0.16em]">
                <tr>
                  <th className="py-4 px-6">Property / Estate</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Category & Stars</th>
                  <th className="py-4 px-4">Inventory</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFB76C]/15 font-sans">
                {properties.map((prop) => {
                  const heroImg = prop.images && prop.images.length > 0 ? prop.images[0].url : null;
                  return (
                    <tr key={prop.id || prop._id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-12 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {heroImg ? (
                              <img src={heroImg} alt={prop.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-[#DFB76C]" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/properties/${prop.id || prop._id}`}
                              className="font-editorial text-base text-[#13152C] hover:text-[#B88E43] transition-colors block font-normal"
                            >
                              {prop.name}
                            </Link>
                            <span className="font-cinzel text-[8.5px] text-[#B88E43] bg-[#FAF6F0] px-1.5 py-0.5 rounded-[2px] border border-[#DFB76C]/30 tracking-widest uppercase">
                              {prop.property_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-[#13152C]/80">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-[#B88E43]" />
                          <span>{prop.city}, {prop.country}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-[#13152C] block font-sans">{prop.property_type}</span>
                          <div className="flex items-center gap-1 text-[#B88E43] text-xs">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-bold font-sans">{prop.star_rating} Star</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/25 text-xs font-semibold text-[#13152C]">
                          <BedDouble className="w-3.5 h-3.5 text-[#DFB76C]" />
                          <span>{prop.total_rooms || 0} Units</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={prop.status} size="sm" />
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/properties/${prop.id || prop._id}`}
                            className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#13152C] hover:bg-[#FAF6F0] transition-colors"
                            title="View Property Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {isAdmin && (
                            <>
                              <Link
                                to={`/properties/${prop.id || prop._id}/edit`}
                                className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#B88E43] hover:bg-[#FAF6F0] transition-colors"
                                title="Edit Property"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>

                              <button
                                onClick={() => setDeleteId(prop.id || prop._id)}
                                className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#993A3A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                                title="Delete Property"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 bg-[#FAF6F0]">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={10}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Hotel Property"
        message="Are you sure you wish to delete this hotel property? All associated room types and units will also be deleted. Active reservations must not exist."
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
