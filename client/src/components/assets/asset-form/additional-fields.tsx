/**
 * Additional Fields Component
 *
 * Location, image picker, and notes fields
 * Junior-Friendly: <100 lines, focused on supplementary inputs
 */

import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { ImageLibraryPicker } from "@/components/assets/image-library-picker";
import { FormData } from "./types";

interface AdditionalFieldsProps {
  form: UseFormReturn<FormData>;
}

export function AdditionalFields({ form }: AdditionalFieldsProps) {
  const { t } = useTranslation();
  const [showImagePicker, setShowImagePicker] = useState(false);

  return (
    <>
      {/* Локация */}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_location")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("assets.form_location_placeholder")}
                data-testid="input-location"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Изображение */}
      <FormField
        control={form.control}
        name="imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_image_url")}</FormLabel>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImagePicker(true)}
                className="w-full justify-start"
                data-testid="button-choose-image"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {field.value ? t("common.change") : t("assets.choose_from_library")}
              </Button>
              {field.value && (
                <div className="relative aspect-video w-full max-w-xs rounded-md border overflow-hidden">
                  <img
                    src={field.value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <ImageLibraryPicker
                open={showImagePicker}
                onOpenChange={setShowImagePicker}
                onSelect={(url) => field.onChange(url)}
                currentValue={field.value}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Заметки */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_notes")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={t("assets.form_notes_placeholder")}
                rows={3}
                data-testid="textarea-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
