import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
            <div className="space-y-4">
                <p className="text-gray-600">{message || 'Are you sure you want to proceed?'}</p>
                <div className="flex justify-end gap-3">
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
