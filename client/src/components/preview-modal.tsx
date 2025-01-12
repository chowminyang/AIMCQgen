import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MCQHistoryItem } from "@/types";

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcqs: MCQHistoryItem[];
  onExport: () => void;
  exportType: 'excel' | 'pdf' | 'practice';
  isLoading?: boolean;
}

export function PreviewModal({
  open,
  onOpenChange,
  mcqs,
  onExport,
  exportType,
  isLoading,
}: PreviewModalProps) {
  const getTitle = () => {
    switch (exportType) {
      case 'excel':
        return 'Export to Excel';
      case 'pdf':
        return 'Export to PDF';
      case 'practice':
        return 'Export Practice PDF';
      default:
        return 'Preview MCQs';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle()} ({mcqs.length} MCQs)</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 my-4">
          <div className="space-y-6">
            {mcqs.map((mcq, index) => (
              <div key={mcq.id} className="space-y-4 border-b pb-4 last:border-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">
                    {index + 1}. {mcq.name}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    Topic: {mcq.topic}
                  </span>
                </div>

                {exportType !== 'practice' && (
                  <>
                    <div>
                      <h4 className="font-medium mb-1">Clinical Scenario</h4>
                      <p className="text-sm">{mcq.parsed_content.clinicalScenario}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Question</h4>
                      <p className="text-sm">{mcq.parsed_content.question}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Options</h4>
                      <div className="space-y-1">
                        {Object.entries(mcq.parsed_content.options).map(([letter, text]) => (
                          <div key={letter} className="text-sm flex">
                            <span className="font-medium w-8">{letter})</span>
                            <span>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Correct Answer</h4>
                      <p className="text-sm">Option {mcq.parsed_content.correctAnswer}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Explanation</h4>
                      <p className="text-sm">{mcq.parsed_content.explanation}</p>
                    </div>
                  </>
                )}

                {exportType === 'practice' && (
                  <>
                    <div>
                      <h4 className="font-medium mb-1">Clinical Scenario</h4>
                      <p className="text-sm">{mcq.parsed_content.clinicalScenario}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Question</h4>
                      <p className="text-sm">{mcq.parsed_content.question}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Options</h4>
                      <div className="space-y-1">
                        {Object.entries(mcq.parsed_content.options).map(([letter, text]) => (
                          <div key={letter} className="text-sm flex">
                            <span className="font-medium w-8">{letter})</span>
                            <span>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm mt-4">Your Answer: _____</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onExport} disabled={isLoading}>
            {isLoading ? 'Exporting...' : `Export to ${exportType.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}