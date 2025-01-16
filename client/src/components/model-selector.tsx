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
        onValueChange={(value: "o1-mini" | "o1-preview" | "gpt-4o") => setModel(value)}
      >
        <SelectTrigger id="model-select" className="w-[200px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="o1-mini" className="flex flex-col items-start">
            <div className="font-medium">o1-mini</div>
            <p className="text-xs text-muted-foreground">Lightweight reasoning model</p>
          </SelectItem>
          <SelectItem value="o1-preview" className="flex flex-col items-start">
            <div className="font-medium">o1-preview</div>
            <p className="text-xs text-muted-foreground">Powerful reasoning model</p>
          </SelectItem>
          <SelectItem value="gpt-4o" className="flex flex-col items-start">
            <div className="font-medium">GPT-4o</div>
            <p className="text-xs text-muted-foreground">Latest OpenAI LLM</p>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}