import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { roomService } from '../../services/roomService';
import { StatusBadge } from '../../components/StatusBadge';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_TRANSITIONS = {
  AVAILABLE: ['RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER'],
  RESERVED: ['OCCUPIED', 'AVAILABLE', 'MAINTENANCE'],
  OCCUPIED: ['CLEANING', 'AVAILABLE', 'MAINTENANCE'],
  CLEANING: ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_ORDER'],
  MAINTENANCE: ['AVAILABLE', 'CLEANING', 'OUT_OF_ORDER'],
  OUT_OF_ORDER: ['AVAILABLE', 'MAINTENANCE', 'CLEANING'],
};

export const RoomStatusModal = ({ isOpen, onClose, room, onSuccess }) => {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!room) return null;

  const currentStatus = room.status || 'AVAILABLE';
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      setError('Please select a target status.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await roomService.updateRoomStatus(room.id || room._id, newStatus, reason.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update State: Suite #${room.room_number}`}
      subtitle="Select an operational state machine transition."
      maxWidth="max-w-md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-[2px] bg-[#1B1E3D] border border-rose-500/40 flex items-center gap-2 text-xs text-rose-400 font-sans">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current status display */}
        <div className="p-3.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] flex items-center justify-between">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/60 font-semibold">
            Current Operational State:
          </span>
          <StatusBadge status={currentStatus} size="sm" />
        </div>

        <div>
          <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#DFB76C] font-bold block mb-2">
            Target State *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allowedTransitions.map((st) => {
              const selected = newStatus === st;
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => setNewStatus(st)}
                  className={`p-2.5 rounded-[2px] border text-xs font-cinzel tracking-wider uppercase font-semibold transition-all text-center cursor-pointer ${
                    selected
                      ? 'bg-[#13152C] border-[#DFB76C] text-[#DFB76C] shadow-sm'
                      : 'bg-[#13152C] border-[#2C315E] text-white/70 hover:border-[#DFB76C]/50 hover:bg-[#1B1E3D]'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#DFB76C] font-bold block mb-1">
            Reason / Operational Log Note
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Turn-down service complete, inspected by head housekeeper..."
            className="w-full luxury-input text-xs font-sans"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C315E]">
          <button
            type="button"
            onClick={onClose}
            className="btn-luxury-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !newStatus}
            className="btn-luxury-primary text-xs"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Commit Transition</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
