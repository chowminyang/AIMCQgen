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
                The MCQ Generator is an advanced AI-powered tool designed specifically for medical education. It leverages cutting-edge AI technology to create high-quality, clinically relevant multiple-choice questions that test second-order thinking skills. Perfect for medical educators, exam preparers, and healthcare professionals who need to create challenging yet fair assessment materials.
              </p>
            </div>

            {/* How to Use */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">How to Use</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium">1. Generate Questions</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-semibold">Select Topic:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Enter a specific medical topic (e.g., "Beta-blockers in heart failure")</li>
                        <li>Be precise to get more focused questions</li>
                        <li>Avoid overly broad topics like "cardiology" or "medicine"</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-semibold">Add Reference Text (Optional):</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Paste relevant clinical guidelines or research papers</li>
                        <li>Include specific information you want to test</li>
                        <li>The AI will incorporate this material into the question</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-semibold">Set Complexity Level:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Low: Basic concept application</li>
                        <li>Medium: Clinical reasoning and decision-making</li>
                        <li>High: Complex case scenarios and advanced concepts</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">2. Review and Edit Generated MCQs</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-semibold">Clinical Scenario:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Check for accuracy and clarity</li>
                        <li>Ensure all vital information is included</li>
                        <li>Verify units and reference ranges</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-semibold">Question Structure:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Verify the question tests second-order thinking</li>
                        <li>Ensure clarity and unambiguity</li>
                        <li>Check if all options are plausible</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-semibold">Explanation:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Review reasoning for correct answer</li>
                        <li>Verify explanations for incorrect options</li>
                        <li>Ensure educational value of feedback</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">3. Manage Your Question Bank</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-semibold">Organization:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Save questions with meaningful names</li>
                        <li>Use consistent topic categorization</li>
                        <li>Rate questions to track quality</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-semibold">Editing:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Update questions as medical knowledge evolves</li>
                        <li>Refine based on student feedback</li>
                        <li>Maintain consistency across your question bank</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">4. Export and Share</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-semibold">PDF Export:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Full version with answers and explanations for teaching</li>
                        <li>Practice version without answers for assessment</li>
                        <li>Professional formatting with consistent styling</li>
                      </ul>
                    </li>
                    <li>
                      <span className="font-semibold">Excel Export:</span>
                      <ul className="list-circle pl-5 mt-1">
                        <li>Bulk editing and organization</li>
                        <li>Easy import into other systems</li>
                        <li>Question bank analysis and tracking</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Advanced Features */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Advanced Features</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="font-semibold">AI Question Generation:</span>
                  <ul className="list-circle pl-5 mt-1">
                    <li>Uses OpenAI's latest models for medical content</li>
                    <li>Ensures clinically relevant scenarios</li>
                    <li>Generates evidence-based explanations</li>
                  </ul>
                </li>
                <li>
                  <span className="font-semibold">Second-Order Thinking Focus:</span>
                  <ul className="list-circle pl-5 mt-1">
                    <li>Tests application of knowledge</li>
                    <li>Emphasizes clinical decision-making</li>
                    <li>Promotes deep learning</li>
                  </ul>
                </li>
                <li>
                  <span className="font-semibold">Quality Assurance:</span>
                  <ul className="list-circle pl-5 mt-1">
                    <li>Built-in formatting and style checks</li>
                    <li>Standard units and reference ranges</li>
                    <li>Consistent question structure</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Best Practices */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Best Practices for Quality MCQs</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Start with specific, well-defined topics</li>
                <li>Include relevant clinical guidelines in reference text</li>
                <li>Review and rate questions regularly</li>
                <li>Use medium complexity for standard assessments</li>
                <li>Maintain a consistent style across questions</li>
                <li>Update questions based on new medical evidence</li>
                <li>Test questions with target audience before large-scale use</li>
                <li>Use practice export format for student assessments</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}