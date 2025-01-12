import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RatingSelectorProps {
  value?: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function RatingSelector({ value = 0, onChange, disabled = false }: RatingSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <Button
          key={rating}
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 hover:bg-transparent",
            rating <= value ? "text-yellow-400" : "text-muted-foreground",
          )}
          disabled={disabled}
          onClick={() => onChange(rating)}
        >
          <Star className="h-4 w-4" fill={rating <= value ? "currentColor" : "none"} />
        </Button>
      ))}
    </div>
  );
}
