"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useData } from "@/components/data-context";
import { supabase } from "@/lib/supabase";

export function DataEntryForm() {
  const { addEntry, entries } = useData();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    soulWinner: "",
    category: "",
    nameOfSoul: "",
    residence: "",
    phoneNumber: "",
    onWhatsapp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Soul winner validation (alphabetic characters only)
    if (!formData.soulWinner) {
      newErrors.soulWinner = "Soul winner name is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.soulWinner)) {
      newErrors.soulWinner = "Only alphabetic characters are allowed";
    }

    // Date validation
    if (!date) {
      newErrors.date = "Date is required";
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    // Name of soul validation (alphabetic characters only)
    if (!formData.nameOfSoul) {
      newErrors.nameOfSoul = "Name of soul is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.nameOfSoul)) {
      newErrors.nameOfSoul = "Only alphabetic characters are allowed";
    }

    // Residence validation
    if (!formData.residence) {
      newErrors.residence = "Residence is required";
    }

    // Phone number validation (10 digits only)
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    // WhatsApp validation
    if (!formData.onWhatsapp) {
      newErrors.onWhatsapp = "Please select an option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // For phone number, only allow digits
    if (name === "phoneNumber" && !/^\d*$/.test(value)) {
      return;
    }

    // For name fields, only allow alphabetic characters
    if (
      (name === "soulWinner" || name === "nameOfSoul") &&
      value !== "" &&
      !/^[A-Za-z\s]*$/.test(value)
    ) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user selects an option
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const checkForDuplicate = async (nameOfSoul: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("soul_entries")
        .select("id")
        .ilike("name_of_soul", nameOfSoul)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error("Error checking for duplicate:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Form Validation Error", {
        description: "Please correct the errors in the form.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate soul name in Supabase
      const isDuplicate = await checkForDuplicate(formData.nameOfSoul);

      if (isDuplicate) {
        toast.error("Duplicate Entry", {
          description: `A soul with the name "${formData.nameOfSoul}" has already been recorded.`,
        });
        setErrors((prev) => ({
          ...prev,
          nameOfSoul: "This name has already been recorded",
        }));
        setIsSubmitting(false);
        return;
      }

      // Create the entry object
      const entryData = {
        soulWinner: formData.soulWinner,
        date: date?.toISOString() || new Date().toISOString(),
        category: formData.category,
        nameOfSoul: formData.nameOfSoul,
        residence: formData.residence,
        phoneNumber: formData.phoneNumber,
        onWhatsapp: formData.onWhatsapp,
      };

      // Add the entry to Supabase via context
      const success = await addEntry(entryData);

      if (success) {
        setIsSuccess(true);
        // toast.success("Success!", {
        //   description: "Data has been successfully submitted.",
        // });

        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            soulWinner: "",
            category: "",
            nameOfSoul: "",
            residence: "",
            phoneNumber: "",
            onWhatsapp: "",
          });
          setDate(undefined);
          setIsSuccess(false);
        }, 2000);
      }
    } catch (error) {
      toast.error("Submission Failed", {
        description:
          "There was an error submitting your data. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {isSuccess && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-blue-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Submission Successful!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your data has been recorded.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="soulWinner" className="text-sm font-medium">
          Soul Winner <span className="text-red-500">*</span>
        </Label>
        <Input
          id="soulWinner"
          name="soulWinner"
          value={formData.soulWinner}
          onChange={handleInputChange}
          placeholder="Enter soul winner's name"
          className={cn(
            "transition-all",
            errors.soulWinner ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
        />
        {errors.soulWinner && (
          <p className="text-red-500 text-xs mt-1">{errors.soulWinner}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Date <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                errors.date ? "border-red-500" : ""
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                setDate(date);
                if (errors.date) {
                  setErrors((prev) => ({ ...prev, date: "" }));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Category <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.category}
          onValueChange={(value) => handleRadioChange("category", value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recommitted" id="recommitted" />
            <Label htmlFor="recommitted" className="font-normal">
              Recommitted to Christ
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="won" id="won" />
            <Label htmlFor="won" className="font-normal">
              Won to Christ
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="encouraged" id="encouraged" />
            <Label htmlFor="encouraged" className="font-normal">
              Encouraged, invited to church & accepted
            </Label>
          </div>
        </RadioGroup>
        {errors.category && (
          <p className="text-red-500 text-xs mt-1">{errors.category}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nameOfSoul" className="text-sm font-medium">
          Name of Soul <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nameOfSoul"
          name="nameOfSoul"
          value={formData.nameOfSoul}
          onChange={handleInputChange}
          placeholder="Enter name of soul"
          className={cn(
            errors.nameOfSoul ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
        />
        {errors.nameOfSoul && (
          <p className="text-red-500 text-xs mt-1">{errors.nameOfSoul}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="residence" className="text-sm font-medium">
          Residence <span className="text-red-500">*</span>
        </Label>
        <Input
          id="residence"
          name="residence"
          value={formData.residence}
          onChange={handleInputChange}
          placeholder="Enter residence"
          className={cn(
            errors.residence ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
        />
        {errors.residence && (
          <p className="text-red-500 text-xs mt-1">{errors.residence}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="text-sm font-medium">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="Enter 10-digit phone number"
          maxLength={10}
          className={cn(
            errors.phoneNumber
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          )}
        />
        {errors.phoneNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          On WhatsApp <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.onWhatsapp}
          onValueChange={(value) => handleRadioChange("onWhatsapp", value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="whatsapp-yes" />
            <Label htmlFor="whatsapp-yes" className="font-normal">
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="whatsapp-no" />
            <Label htmlFor="whatsapp-no" className="font-normal">
              No
            </Label>
          </div>
        </RadioGroup>
        {errors.onWhatsapp && (
          <p className="text-red-500 text-xs mt-1">{errors.onWhatsapp}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Data"
        )}
      </Button>
    </form>
  );
}
