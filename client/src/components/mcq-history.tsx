import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Check, Pencil, Trash, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { MCQHistoryItem } from "@/types";

interface MCQHistoryProps {
  items: MCQHistoryItem[];
  onEdit: (mcq: MCQHistoryItem) => void;
  onDelete: (id: number) => void;
}

export function MCQHistory({ items, onEdit, onDelete }: MCQHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
    try {
      const response = await fetch('/api/mcq/export/xlsx', {
        method: 'GET',
      });

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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export MCQs to Excel",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/mcq/export/pdf', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mcq-library-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "MCQs exported to PDF successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export MCQs to PDF",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No MCQs in library yet. Try creating one!
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleExportXLSX}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export to Excel
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExportPDF}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id.toString()}>
            <AccordionTrigger className="flex items-center gap-4">
              <div className="flex-1 text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  Topic: {item.topic} • {format(new Date(item.created_at), "PPpp")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(item.raw_content, item.id);
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
        ))}
      </Accordion>

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