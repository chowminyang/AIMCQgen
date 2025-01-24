import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ReasoningEffort = "low" | "medium" | "high";

interface ReasoningEffortSelectorProps {
  value: ReasoningEffort;
  onChange: (value: ReasoningEffort) => void;
}

export function ReasoningEffortSelector({ value, onChange }: ReasoningEffortSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="reasoning-select">Reasoning Effort</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger id="reasoning-select" className="w-[200px]">
          <SelectValue placeholder="Select reasoning effort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low" className="flex flex-col items-start">
            <div className="font-medium">Low</div>
            <p className="text-xs text-muted-foreground">Basic analysis and explanation</p>
          </SelectItem>
          <SelectItem value="medium" className="flex flex-col items-start">
            <div className="font-medium">Medium</div>
            <p className="text-xs text-muted-foreground">Balanced depth and detail</p>
          </SelectItem>
          <SelectItem value="high" className="flex flex-col items-start">
            <div className="font-medium">High</div>
            <p className="text-xs text-muted-foreground">Thorough analysis and detailed rationale</p>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
