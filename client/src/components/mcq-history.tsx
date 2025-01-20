import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Check, Pencil, Trash, FileSpreadsheet, FileText, GraduationCap, Star, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { MCQHistoryItem } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { PreviewModal } from "./preview-modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MCQHistoryProps {
  items: MCQHistoryItem[];
  onEdit: (mcq: MCQHistoryItem) => void;
  onDelete: (id: number) => void;
  onRate: (id: number, rating: number) => void;
}

const StarRating = ({ rating, onRate, itemId }: { rating: number; onRate: (id: number, rating: number) => void; itemId: number }) => {
  const [hoveredRating, setHoveredRating] = useState<{ id: number; rating: number } | null>(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => {
            e.stopPropagation();
            onRate(itemId, star);
          }}
          onMouseEnter={() => setHoveredRating({ id: itemId, rating: star })}
          onMouseLeave={() => setHoveredRating(null)}
          className={`hover:scale-110 transition-all duration-200 ${
            (hoveredRating?.id === itemId && star <= hoveredRating.rating) ||
            (hoveredRating?.id !== itemId && star <= (rating || 0))
              ? 'text-yellow-400'
              : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          <Star
            className={`h-4 w-4 transform ${
              (hoveredRating?.id === itemId && star <= hoveredRating.rating) ||
              (hoveredRating?.id !== itemId && star <= (rating || 0))
                ? 'fill-current'
                : ''
            }`}
          />
        </button>
      ))}
    </div>
  );
};

function formatMCQContent(mcq: MCQHistoryItem): string {
  return `NAME:
${mcq.name}

CLINICAL SCENARIO:
${mcq.parsed_content.clinicalScenario}

QUESTION:
${mcq.parsed_content.question}

OPTIONS:
A) ${mcq.parsed_content.options.A}
B) ${mcq.parsed_content.options.B}
C) ${mcq.parsed_content.options.C}
D) ${mcq.parsed_content.options.D}
E) ${mcq.parsed_content.options.E}

CORRECT ANSWER: ${mcq.parsed_content.correctAnswer}

EXPLANATION:
${mcq.parsed_content.explanation}`;
}

function SortableAccordionItem({
  item,
  onEdit,
  onDelete,
  onRate,
  selectedMcqs,
  toggleSelection,
  copiedId,
  setDeleteConfirmId,
  copyToClipboard,
}: {
  item: MCQHistoryItem;
  onEdit: (mcq: MCQHistoryItem) => void;
  onDelete: (id: number) => void;
  onRate: (id: number, rating: number) => void;
  selectedMcqs: Set<number>;
  toggleSelection: (id: number) => void;
  copiedId: number | null;
  setDeleteConfirmId: (id: number | null) => void;
  copyToClipboard: (text: string, id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <AccordionItem key={item.id} value={item.id.toString()} ref={setNodeRef} style={style}>
      <AccordionTrigger className="flex items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <Checkbox
            checked={selectedMcqs.has(item.id)}
            onCheckedChange={() => toggleSelection(item.id)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">
              Topic: {item.topic} • Model: {item.model} • {format(new Date(item.created_at), "PPpp")}
            </div>
          </div>
          <StarRating rating={item.rating} onRate={onRate} itemId={item.id} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(formatMCQContent(item), item.id);
            }}
          >
            {copiedId === item.id ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmId(item.id);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6 p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-semibold mb-2">Clinical Scenario</h3>
            <p className="text-sm">{item.parsed_content.clinicalScenario}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Question</h3>
            <p className="text-sm">{item.parsed_content.question}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Options</h3>
            <div className="space-y-2">
              {Object.entries(item.parsed_content.options).map(([letter, text]) => (
                <div key={letter} className="text-sm flex">
                  <span className="font-medium w-8">{letter})</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Correct Answer</h3>
            <p className="text-sm">Option {item.parsed_content.correctAnswer}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Explanation</h3>
            <p className="text-sm">{item.parsed_content.explanation}</p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function MCQHistory({ items, onEdit, onDelete, onRate }: MCQHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedMcqs, setSelectedMcqs] = useState<Set<number>>(new Set());
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | 'practice'>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [orderedItems, setOrderedItems] = useState<MCQHistoryItem[]>(items);

  // Update orderedItems when items prop changes
  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast({
        title: "Copied to clipboard",
        description: "MCQ has been copied to your clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleExportXLSX = async () => {
    setIsExporting(true);
    try {
      const queryParams = selectedMcqs.size > 0 ? `?ids=${Array.from(selectedMcqs).join(',')}` : '';
      const response = await fetch(`/api/mcq/export/xlsx${queryParams}`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcq-library-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "MCQs exported to Excel successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export MCQs to Excel",
      });
    } finally {
      setIsExporting(false);
      setPreviewModalOpen(false);
    }
  };

  const handleExportPDF = async (type: 'full' | 'learner' = 'full') => {
    setIsExporting(true);
    try {
      const queryParams = selectedMcqs.size > 0 ? `?ids=${Array.from(selectedMcqs).join(',')}` : '';
      const endpoint = type === 'learner' ? '/api/mcq/export/pdf/learner' : '/api/mcq/export/pdf';
      const filename = type === 'learner' ? 'mcq-practice' : 'mcq-library';

      const response = await fetch(`${endpoint}${queryParams}`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `MCQs exported to PDF successfully${type === 'learner' ? ' (Practice Version)' : ''}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export MCQs to PDF",
      });
    } finally {
      setIsExporting(false);
      setPreviewModalOpen(false);
    }
  };

  const handleExport = () => {
    switch (exportType) {
      case 'excel':
        handleExportXLSX();
        break;
      case 'pdf':
        handleExportPDF('full');
        break;
      case 'practice':
        handleExportPDF('learner');
        break;
    }
  };

  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedMcqs);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMcqs(newSelection);
  };

  const getSelectedMcqs = () => {
    if (selectedMcqs.size === 0) return orderedItems;
    return orderedItems.filter(item => selectedMcqs.has(item.id));
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No MCQs in library yet. Try creating one!
      </div>
    );
  }

  const hasSelection = selectedMcqs.size > 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedMcqs.size === items.length}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedMcqs(new Set(items.map(item => item.id)));
              } else {
                setSelectedMcqs(new Set());
              }
            }}
          />
          <span className="text-sm text-muted-foreground">
            {selectedMcqs.size} MCQ{selectedMcqs.size !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setExportType('excel');
              setPreviewModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export {hasSelection ? 'Selected ' : ''}to Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setExportType('pdf');
              setPreviewModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export {hasSelection ? 'Selected ' : ''}to PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setExportType('practice');
              setPreviewModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            Export {hasSelection ? 'Selected ' : ''}Practice PDF
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Accordion type="single" collapsible className="w-full">
          <SortableContext
            items={orderedItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedItems.map((item) => (
              <SortableAccordionItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onRate={onRate}
                selectedMcqs={selectedMcqs}
                toggleSelection={toggleSelection}
                copiedId={copiedId}
                setDeleteConfirmId={setDeleteConfirmId}
                copyToClipboard={copyToClipboard}
              />
            ))}
          </SortableContext>
        </Accordion>
      </DndContext>

      <PreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        mcqs={getSelectedMcqs()}
        exportType={exportType}
        onExport={handleExport}
        isLoading={isExporting}
      />

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this MCQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}