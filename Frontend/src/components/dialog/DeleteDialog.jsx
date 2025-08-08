import React from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Card } from "@material-tailwind/react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const DeleteDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi Hapus",
  message = "Apakah Anda yakin ingin menghapus data ini?",
  itemName = "",
  loading = false
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  };

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="sm"
      className="bg-white shadow-none"
      dismiss={{ enabled: !loading }}
    >
      <Card className="mx-auto w-full">
        <DialogHeader className="flex justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <h5 className="text-xl font-medium text-gray-900">{title}</h5>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </DialogHeader>

        <DialogBody className="text-center py-6">
          <p className="text-gray-600 mb-2">{message}</p>
          {itemName && (
            <p className="font-semibold text-gray-800">"{itemName}"</p>
          )}
        </DialogBody>

        <DialogFooter className="flex justify-end gap-2 border-t border-gray-200 p-4">
          <Button
            variant="outlined"
            color="blue"
            onClick={onClose}
            disabled={loading}
            className="flex items-center gap-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            variant="filled"
            color="red"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <span>Menghapus...</span>
              </>
            ) : (
              "Hapus"
            )}
          </Button>
        </DialogFooter>
      </Card>
    </Dialog>
  );
};

export default DeleteDialog;
