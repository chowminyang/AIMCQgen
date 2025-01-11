import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MCQDisplayProps {
  mcqText: string;
  onSave?: (name: string) => void;
}

export function MCQDisplay({ mcqText, onSave }: MCQDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mcqText).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "MCQ has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for this MCQ",
      });
      return;
    }
    onSave?.(name);
    setShowSaveForm(false);
    setName("");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Generated MCQ</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveForm(true)}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save to Library
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {showSaveForm && (
          <div className="mb-4 space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="mcq-name">MCQ Name</Label>
              <Input
                id="mcq-name"
                placeholder="Enter a name for this MCQ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save MCQ</Button>
              <Button variant="outline" onClick={() => setShowSaveForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="text-sm whitespace-pre-wrap font-sans">{mcqText}</pre>
        </div>
      </CardContent>
    </Card>
  );
}