import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Tag, User } from "lucide-react";
import type { Category, PersonalTag } from "@shared/schema";
import { useTranslateCategory } from "@/lib/category-translations";

interface AISuggestionBoxProps {
  categoryId: number | null;
  tagId: number | null;
  confidence: number;
  categories: Category[];
  tags: PersonalTag[];
  onCategoryChange: (categoryId: number | null) => void;
  onTagChange: (tagId: number | null) => void;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "bg-green-500";
  if (confidence >= 70) return "bg-yellow-500";
  if (confidence >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return "Very High";
  if (confidence >= 70) return "High";
  if (confidence >= 50) return "Medium";
  return "Low";
}

export function AISuggestionBox({
  categoryId,
  tagId,
  confidence,
  categories,
  tags,
  onCategoryChange,
  onTagChange,
}: AISuggestionBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const translateCategory = useTranslateCategory();

  return (
    <div className="w-full max-w-sm space-y-3 p-4 rounded-lg bg-muted/50 border" data-testid="ai-suggestion-box">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Suggestion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getConfidenceColor(confidence)}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{getConfidenceLabel(confidence)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {isEditing ? (
            <Select
              value={categoryId?.toString() || ""}
              onValueChange={(value) => {
                onCategoryChange(value ? parseInt(value) : null);
                setIsEditing(false);
              }}
            >
              <SelectTrigger className="h-8 w-full" data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {translateCategory(cat.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-category"
            >
              {categoryId ? (
                <Badge variant="secondary">
                  {translateCategory(categories.find((c) => c.id === categoryId)?.name || "Unknown")}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">No category</span>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <Select
            value={tagId?.toString() || undefined}
            onValueChange={(value) => onTagChange(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="h-8 w-full" data-testid="select-tag">
              <SelectValue placeholder="Select tag (optional)" />
            </SelectTrigger>
            <SelectContent>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id.toString()}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
