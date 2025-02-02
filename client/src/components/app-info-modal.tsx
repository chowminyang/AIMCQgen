import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Help & Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Welcome to MCQ Generator!</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-6">
            {/* What is this app? */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">What is this app?</h3>
              <p className="text-sm text-muted-foreground">
                The MCQ Generator is an AI-powered tool designed to create high-quality medical multiple-choice questions. 
                It helps educators and medical professionals generate challenging questions that test second-order thinking skills.
              </p>
            </div>

            {/* How to Use */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">How to Use</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium">1. Generate Questions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Enter your medical topic in the input field</li>
                    <li>Optionally add reference text for more specific questions</li>
                    <li>Choose the complexity level (low, medium, high)</li>
                    <li>Click "Generate" to create your MCQ</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">2. Review and Edit</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Preview the generated question</li>
                    <li>Edit any part of the MCQ if needed</li>
                    <li>Save to your library when satisfied</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">3. Manage Your MCQs</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>View all saved MCQs in your library</li>
                    <li>Rate questions for quality tracking</li>
                    <li>Edit or delete questions as needed</li>
                    <li>Export selected MCQs to PDF or Excel</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">4. Export Options</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Export to PDF with full answers and explanations</li>
                    <li>Create practice sets without answers</li>
                    <li>Export to Excel for easy editing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Key Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>AI-powered question generation using OpenAI models</li>
                <li>Second-order thinking focus for deeper learning</li>
                <li>Multiple complexity levels to suit different needs</li>
                <li>Built-in question editor for customization</li>
                <li>Multiple export formats (PDF, Excel)</li>
                <li>Practice set generation for student assessment</li>
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Tips for Best Results</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Be specific with your medical topics</li>
                <li>Provide reference text for more targeted questions</li>
                <li>Use medium complexity for standard educational assessments</li>
                <li>Review and rate MCQs to help improve generation quality</li>
                <li>Export in practice format for student assessments</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}