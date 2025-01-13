import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useModelStore } from "@/lib/modelStore";

export function ModelSelector() {
  const { currentModel, setModel } = useModelStore();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="model-select">AI Model</Label>
      <Select 
        value={currentModel} 
        onValueChange={(value: "o1-mini" | "o1-preview") => setModel(value)}
      >
        <SelectTrigger id="model-select" className="w-[200px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="o1-mini">o1-mini</SelectItem>
          <SelectItem value="o1-preview">o1-preview</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}