import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-text-muted">{message || 'Are you sure you want to proceed?'}</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
