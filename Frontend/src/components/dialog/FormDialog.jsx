import React from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import PropTypes from 'prop-types';

const FormDialog = ({ 
  open, 
  onClose, 
  title, 
  children, 
  onSubmit,
  size = "xl",
  loading = false,
  submitLabel = "Simpan",
  cancelLabel = "Batal"
}) => {
  return (
    <Dialog
      open={open}
      handler={onClose}
      size={size}
      className="bg-white shadow-none"
    >
      <form onSubmit={onSubmit}>
        <DialogHeader className="flex justify-between border-b border-gray-200 p-4">
          <h5 className="text-xl font-medium text-gray-900">{title}</h5>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </DialogHeader>

        <DialogBody className="overflow-y-auto max-h-[60vh] p-4">
          {children}
        </DialogBody>

        <DialogFooter className="flex justify-end gap-2 border-t border-gray-200 p-4">
          <Button
            variant="outlined"
            color="red"
            onClick={onClose}
            className="flex items-center gap-2 px-6"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="filled"
            color="blue"
            disabled={loading}
            className="flex items-center gap-2 px-6"
          >
            {loading ? "Menyimpan..." : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

FormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", "xxl"]),
  loading: PropTypes.bool,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string
};  

export default FormDialog;
