import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          About This App
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Application Structure</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-6">
            {/* Frontend Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Frontend (React + TypeScript)</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Located in /client/src</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Uses React with TypeScript for type safety</li>
                  <li>UI components built with Shadcn/UI (customizable React components)</li>
                  <li>State management using React Query for API data fetching/caching</li>
                  <li>Styling with Tailwind CSS</li>
                  <li>Routing with Wouter (lightweight router)</li>
                </ul>
              </div>
            </div>

            {/* Backend Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Backend (Node.js + Express)</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Located in /server</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Express.js server handling HTTP requests</li>
                  <li>RESTful API endpoints for:
                    <ul className="list-circle pl-5 mt-1">
                      <li>MCQ generation leveraging OpenAI's o1 series of reasoning models</li>
                      <li>CRUD operations for MCQs</li>
                      <li>User authentication</li>
                      <li>System prompt management</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>

            {/* Database Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Database (PostgreSQL)</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Schema defined in /db/schema.ts using Drizzle ORM</p>
                <p>Two main tables:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>users: Stores user authentication data</li>
                  <li>mcqs: Stores generated MCQs with their metadata</li>
                </ul>
              </div>
            </div>

            {/* Key APIs Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Key APIs</h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium">OpenAI Integration:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Uses o3-mini model for generating MCQs</li>
                    <li>Structured prompt system for consistent output</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">RESTful Endpoints:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>/api/mcq/generate: Generate new MCQs</li>
                    <li>/api/mcq/save: Save MCQs to database</li>
                    <li>/api/mcq/history: Fetch MCQ history</li>
                    <li>/api/prompt: Manage system prompts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Libraries Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Key Libraries</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>@tanstack/react-query: Data fetching/caching</li>
                  <li>openai: OpenAI API integration</li>
                  <li>drizzle-orm: Database ORM</li>
                  <li>express: Backend server</li>
                </ul>
                <ul className="list-disc pl-5 space-y-1">
                  <li>tailwindcss: Utility-first CSS</li>
                  <li>shadcn/ui: React component library</li>
                  <li>zod: Schema validation</li>
                </ul>
              </div>
            </div>

            {/* Architecture Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Architecture</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>The application follows a typical three-tier architecture:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Presentation Layer (React frontend)</li>
                  <li>Application Layer (Express backend)</li>
                  <li>Data Layer (PostgreSQL database)</li>
                </ul>
                <p className="mt-4">All components communicate via RESTful APIs, with TypeScript ensuring type safety across the full stack.</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}