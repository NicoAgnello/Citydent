import React from 'react'
import { Dialog, DialogContent } from "../ui/dialog"
import IncidentForm from './IncidentForm'

const IncidentModal = ({ open, onOpenChange, onCreated }) => {
  const controlled = open !== undefined;

  return (
    <Dialog
      open={controlled ? open : undefined}
      onOpenChange={controlled ? onOpenChange : undefined}
    >
      <DialogContent
        showCloseButton={false}
        className="
          p-0 gap-0 flex flex-col border-none bg-white overflow-hidden
          !top-auto !bottom-0 !left-0 !right-0 !translate-x-0 !translate-y-0
          !max-w-full !w-full h-[92dvh] rounded-t-2xl
          sm:!top-1/2 sm:!bottom-auto sm:!left-1/2 sm:!right-auto
          sm:!-translate-x-1/2 sm:!-translate-y-1/2
          sm:!max-w-2xl sm:!w-full sm:h-auto sm:max-h-[90dvh]
          sm:rounded-2xl
        "
      >
        <IncidentForm
          onSuccess={() => {
            onOpenChange?.(false);
            onCreated?.();
          }}
          onClose={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default IncidentModal;
