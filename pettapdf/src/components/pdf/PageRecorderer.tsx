import { useState } from "react";
import { PdfThumbnail } from "./PdfThumbnail";

interface Props {
  thumbnails: string[];
  pageCount: number;
  currentPage: number;
  onSelect: (page: number) => void;
  onRotate: (pageIndex: number) => void;
  onDelete: (pageIndex: number) => void;
  onReorder: (from: number, to: number) => void;
}

/** Lista de miniaturas com reordenação por arrastar e soltar. */
export function PageReorderer({
  thumbnails,
  pageCount,
  currentPage,
  onSelect,
  onRotate,
  onDelete,
  onReorder,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: pageCount }).map((_, index) => (
        <PdfThumbnail
          key={index}
          index={index}
          url={thumbnails[index]}
          active={currentPage === index + 1}
          onSelect={() => onSelect(index + 1)}
          onRotate={() => onRotate(index)}
          onDelete={() => onDelete(index)}
          draggableProps={{
            draggable: true,
            onDragStart: () => setDragIndex(index),
            onDragOver: (e) => e.preventDefault(),
            onDrop: () => {
              if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
              setDragIndex(null);
            },
          }}
        />
      ))}
    </div>
  );
}