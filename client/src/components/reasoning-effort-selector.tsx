import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Brain } from "lucide-react";

type ReasoningEffort = "low" | "medium" | "high";

interface ReasoningEffortSelectorProps {
  value: ReasoningEffort;
  onChange: (value: ReasoningEffort) => void;
}

export function ReasoningEffortSelector({ value, onChange }: ReasoningEffortSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="reasoning-toggle">Reasoning Effort:</Label>
      <ToggleGroup 
        id="reasoning-toggle"
        type="single" 
        value={value}
        onValueChange={(val) => val && onChange(val as ReasoningEffort)}
        className="justify-start"
      >
        <ToggleGroupItem value="low" aria-label="Low reasoning effort">
          <Brain className="h-4 w-4 mr-2" />
          Low
        </ToggleGroupItem>
        <ToggleGroupItem value="medium" aria-label="Medium reasoning effort">
          <Brain className="h-4 w-4 mr-2" />
          Medium
        </ToggleGroupItem>
        <ToggleGroupItem value="high" aria-label="High reasoning effort">
          <Brain className="h-4 w-4 mr-2" />
          High
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}