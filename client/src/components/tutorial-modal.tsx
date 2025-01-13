import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useState } from "react";

const tutorialSteps = [
  {
    title: "Welcome to MCQ Generator!",
    description: "Let's walk through the key features of this application. Click 'Next' to continue.",
  },
  {
    title: "Select Your AI Model",
    description: "Choose between o1-mini and o1-preview models. Both models are optimized for generating high-quality MCQs.",
  },
  {
    title: "Enter Your Topic",
    description: "Type in any medical topic you want to create questions about. You can also provide optional reference text for more specific questions.",
  },
  {
    title: "Review and Edit",
    description: "After generation, you can review and edit the MCQ before saving it to your library. The editor allows you to modify all parts of the question.",
  },
  {
    title: "MCQ Library",
    description: "All your saved MCQs are stored in the library. You can rate, edit, or delete them anytime.",
  },
  {
    title: "Export Options",
    description: "Export your MCQs to PDF or Excel format. You can also generate a practice version without answers for testing.",
  },
];

export function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setCurrentStep(0);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tutorialSteps[currentStep].title}</DialogTitle>
          <DialogDescription className="pt-4">
            {tutorialSteps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}