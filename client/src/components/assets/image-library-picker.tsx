import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { Check } from "lucide-react";

import houseImg from "@assets/generated_images/modern_house_illustration.png";
import apartmentImg from "@assets/generated_images/apartment_building_illustration.png";
import officeImg from "@assets/generated_images/office_building_illustration.png";
import cottageImg from "@assets/generated_images/cottage_house_illustration.png";
import landImg from "@assets/generated_images/land_plot_illustration.png";

import carImg from "@assets/generated_images/modern_car_illustration.png";
import motorcycleImg from "@assets/generated_images/motorcycle_illustration.png";
import yachtImg from "@assets/generated_images/yacht_illustration.png";
import bicycleImg from "@assets/generated_images/bicycle_illustration.png";
import electricCarImg from "@assets/generated_images/electric_car_illustration.png";

import cafeImg from "@assets/generated_images/cafe_storefront_illustration.png";
import shopImg from "@assets/generated_images/retail_shop_illustration.png";
import officeCenterImg from "@assets/generated_images/office_center_illustration.png";
import warehouseImg from "@assets/generated_images/warehouse_illustration.png";
import factoryImg from "@assets/generated_images/factory_illustration.png";

import laptopImg from "@assets/generated_images/laptop_illustration.png";
import cameraImg from "@assets/generated_images/camera_illustration.png";
import smartphoneImg from "@assets/generated_images/smartphone_illustration.png";
import tabletImg from "@assets/generated_images/tablet_illustration.png";
import headphonesImg from "@assets/generated_images/headphones_illustration.png";

import drillImg from "@assets/generated_images/drill_illustration.png";
import sawImg from "@assets/generated_images/saw_illustration.png";
import welderImg from "@assets/generated_images/welder_illustration.png";
import toolboxImg from "@assets/generated_images/toolbox_illustration.png";
import cncImg from "@assets/generated_images/cnc_machine_illustration.png";

interface ImageLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
  currentValue?: string;
}

const imageCategories = {
  realestate: [
    { url: houseImg, alt: "House" },
    { url: apartmentImg, alt: "Apartment" },
    { url: officeImg, alt: "Office" },
    { url: cottageImg, alt: "Cottage" },
    { url: landImg, alt: "Land" },
  ],
  transport: [
    { url: carImg, alt: "Car" },
    { url: motorcycleImg, alt: "Motorcycle" },
    { url: yachtImg, alt: "Yacht" },
    { url: bicycleImg, alt: "Bicycle" },
    { url: electricCarImg, alt: "Electric Car" },
  ],
  business: [
    { url: cafeImg, alt: "Cafe" },
    { url: shopImg, alt: "Shop" },
    { url: officeCenterImg, alt: "Office Center" },
    { url: warehouseImg, alt: "Warehouse" },
    { url: factoryImg, alt: "Factory" },
  ],
  tech: [
    { url: laptopImg, alt: "Laptop" },
    { url: cameraImg, alt: "Camera" },
    { url: smartphoneImg, alt: "Smartphone" },
    { url: tabletImg, alt: "Tablet" },
    { url: headphonesImg, alt: "Headphones" },
  ],
  tools: [
    { url: drillImg, alt: "Drill" },
    { url: sawImg, alt: "Saw" },
    { url: welderImg, alt: "Welder" },
    { url: toolboxImg, alt: "Toolbox" },
    { url: cncImg, alt: "CNC Machine" },
  ],
};

export function ImageLibraryPicker({
  open,
  onOpenChange,
  onSelect,
  currentValue,
}: ImageLibraryPickerProps) {
  const { t } = useTranslation();
  const [customUrl, setCustomUrl] = useState(currentValue || "");
  const [selectedImage, setSelectedImage] = useState<string | null>(currentValue || null);

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    setCustomUrl("");
  };

  const handleCustomUrlChange = (value: string) => {
    setCustomUrl(value);
    setSelectedImage(null);
  };

  const handleConfirm = () => {
    const finalUrl = selectedImage || customUrl;
    onSelect(finalUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("assets.choose_from_library")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="realestate" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-max">
              <TabsTrigger value="realestate" data-testid="tab-realestate">
                {t("assets.library_realestate")}
              </TabsTrigger>
              <TabsTrigger value="transport" data-testid="tab-transport">
                {t("assets.library_transport")}
              </TabsTrigger>
              <TabsTrigger value="business" data-testid="tab-business">
                {t("assets.library_business")}
              </TabsTrigger>
              <TabsTrigger value="tech" data-testid="tab-tech">
                {t("assets.library_tech")}
              </TabsTrigger>
              <TabsTrigger value="tools" data-testid="tab-tools">
                {t("assets.library_tools")}
              </TabsTrigger>
            </TabsList>
          </div>

          {Object.entries(imageCategories).map(([category, images]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleImageSelect(img.url)}
                    className={`relative aspect-square rounded-md border-2 overflow-hidden hover-elevate active-elevate-2 transition-all ${
                      selectedImage === img.url
                        ? "border-primary ring-2 ring-primary"
                        : "border-border"
                    }`}
                    data-testid={`image-option-${category}-${idx}`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === img.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-8 h-8 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-2 pt-4 border-t">
          <Label>{t("assets.or_enter_url")}</Label>
          <Input
            value={customUrl}
            onChange={(e) => handleCustomUrlChange(e.target.value)}
            placeholder={t("assets.form_image_url_placeholder")}
            data-testid="input-custom-url"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedImage && !customUrl}
            data-testid="button-confirm"
          >
            {t("common.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
