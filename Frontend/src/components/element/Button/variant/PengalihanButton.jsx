import React from "react";
import { Button, Tooltip } from "@material-tailwind/react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

const PengalihanButton = ({ onClick }) => {
  return (
    <Tooltip content="Edit Pengalihan Sekolah">
      <Button
        size="sm"
        className="p-2 bg-green-500 hover:bg-green-600 rounded-md shadow-sm"
        onClick={onClick}
      >
        <PencilSquareIcon className="h-4 w-4 text-white" />
      </Button>
    </Tooltip>
  );
};

export default PengalihanButton;
