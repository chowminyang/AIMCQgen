import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, Save } from "lucide-react";

interface PromptEditorProps {
  currentPrompt: string;
  onSave: (prompt: string) => void;
}

export function PromptEditor({ currentPrompt, onSave }: PromptEditorProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt);
  const { toast } = useToast();

  const handleUnlock = () => {
    if (password === "CMYMCQadmin") {
      setIsUnlocked(true);
      setPassword("");
      toast({
        title: "Admin Access Granted",
        description: "You can now edit the system prompt.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Incorrect admin password.",
      });
    }
  };

  const handleSave = () => {
    if (!isUnlocked) return;
    onSave(editedPrompt);
    toast({
      title: "Success",
      description: "System prompt has been updated.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isUnlocked ? (
            <Unlock className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
          System Prompt Editor
        </CardTitle>
        <CardDescription>
          Edit the system prompt sent to the OpenAI API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isUnlocked ? (
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="Enter admin password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            <Button onClick={handleUnlock}>Unlock</Button>
          </div>
        ) : (
          <>
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="min-h-[400px] font-mono"
              placeholder="Enter system prompt..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUnlocked(false);
                  setEditedPrompt(currentPrompt);
                }}
              >
                Lock
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
