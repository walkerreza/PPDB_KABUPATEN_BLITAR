import { useState, useCallback } from 'react';

const useFormDialog = (initialState = false) => {
  const [dialog, setDialog] = useState({
    open: initialState,
    mode: 'add', // 'add' atau 'edit'
    data: null,
    loading: false
  });

  const openAdd = useCallback(() => {
    setDialog({
      open: true,
      mode: 'add',
      data: null,
      loading: false
    });
  }, []);

  const openEdit = useCallback((data) => {
    setDialog({
      open: true,
      mode: 'edit',
      data: data,
      loading: false
    });
  }, []);

  const close = useCallback(() => {
    setDialog({
      open: false,
      mode: 'add',
      data: null,
      loading: false
    });
  }, []);

  const setLoading = useCallback((loading) => {
    setDialog(prev => ({
      ...prev,
      loading
    }));
  }, []);

  return {
    isOpen: dialog.open,
    mode: dialog.mode,
    data: dialog.data,
    loading: dialog.loading,
    openAdd,
    openEdit,
    close,
    setLoading
  };
};

export default useFormDialog;
