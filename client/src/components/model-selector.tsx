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
        onValueChange={(value: "o4-mini") => setModel(value)}
      >
        <SelectTrigger id="model-select" className="w-[200px]">
          <SelectValue placeholder="o4-mini" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="o4-mini" className="flex flex-col items-start">
            <div className="font-medium">o4-mini</div>
            <p className="text-xs text-muted-foreground">Advanced reasoning model</p>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}