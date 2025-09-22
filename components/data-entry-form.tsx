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
  const { addEntry } = useData();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    soulWinner: "",
    zone: "",
    category: "",
    nameOfSoul: "",
    residence: "",
    age: "",
    phoneNumber: "",
    onWhatsapp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.soulWinner) {
      newErrors.soulWinner = "Soul winner name is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.soulWinner)) {
      newErrors.soulWinner = "Only alphabetic characters are allowed";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.nameOfSoul) {
      newErrors.nameOfSoul = "Name of soul is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.nameOfSoul)) {
      newErrors.nameOfSoul = "Only alphabetic characters are allowed";
    }

    if (!formData.residence) {
      newErrors.residence = "Residence is required";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if (!formData.onWhatsapp) {
      newErrors.onWhatsapp = "Please select an option";
    }

    if (!formData.zone) {
      newErrors.zone = "Please select a zone";
    }

    // if (!formData.age) {
    //   newErrors.age = "Age is required";
    // } else if (!/^\d+$/.test(formData.age)) {
    //   newErrors.age = "Age must be a number";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phoneNumber" && !/^\d*$/.test(value)) return;

    if (
      (name === "soulWinner" || name === "nameOfSoul") &&
      value !== "" &&
      !/^[A-Za-z\s]*$/.test(value)
    ) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      if (error) throw error;

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

      const entryData = {
        soulWinner: formData.soulWinner,
        zone: formData.zone,
        date: date?.toISOString() || new Date().toISOString(),
        category: formData.category,
        nameOfSoul: formData.nameOfSoul,
        age: formData.age,
        residence: formData.residence,
        phoneNumber: formData.phoneNumber,
        onWhatsapp: formData.onWhatsapp,
      };
      console.log("Submitting entry data:", entryData);
      const success = await addEntry(entryData);

      if (success) {
        setIsSuccess(true);

        setTimeout(() => {
          setFormData({
            soulWinner: "",
            zone: "",
            category: "",
            nameOfSoul: "",
            age: "",
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

      {/* Soul Winner */}
      <div className="space-y-2">
        <Label htmlFor="soulWinner">
          Soul Winner <span className="text-red-500">*</span>
        </Label>
        <Input
          id="soulWinner"
          name="soulWinner"
          value={formData.soulWinner}
          onChange={handleInputChange}
          placeholder="Enter soul winner's name"
          className={cn(errors.soulWinner && "border-red-500")}
        />
        {errors.soulWinner && (
          <p className="text-red-500 text-xs">{errors.soulWinner}</p>
        )}
      </div>

      {/* Zone */}
      <div className="space-y-2">
        <Label htmlFor="zone">
          Zone <span className="text-red-500">*</span>
        </Label>
        <select
          id="zone"
          name="zone"
          value={formData.zone}
          onChange={handleInputChange}
          className={cn(
            "w-full border rounded-md px-3 py-2 text-sm",
            errors.zone ? "border-red-500 ring-red-500" : "border-gray-300"
          )}
        >
          <option value="">Select Zone</option>
          <option value="Zone 1">Zone 1</option>
          <option value="Zone 2">Zone 2</option>
          <option value="Zone 4">Zone 4</option>
          <option value="Other">Other</option>
        </select>
        {errors.zone && <p className="text-red-500 text-xs">{errors.zone}</p>}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>
          Date <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                errors.date && "border-red-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
      </div>

      {/* Name of Soul */}
      <div className="space-y-2">
        <Label htmlFor="nameOfSoul">
          Name of Soul <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nameOfSoul"
          name="nameOfSoul"
          value={formData.nameOfSoul}
          onChange={handleInputChange}
          placeholder="Enter name of soul"
          className={cn(errors.nameOfSoul && "border-red-500")}
        />
        {errors.nameOfSoul && (
          <p className="text-red-500 text-xs">{errors.nameOfSoul}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>
          Category <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.category}
          onValueChange={(val) => handleRadioChange("category", val)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recommitted" id="recommitted" />
            <Label htmlFor="recommitted">Recommitted to Christ</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="won" id="won" />
            <Label htmlFor="won">Won to Christ</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="encouraged" id="encouraged" />
            <Label htmlFor="encouraged">
              Encouraged, invited to church & accepted
            </Label>
          </div>
        </RadioGroup>
        {errors.category && (
          <p className="text-red-500 text-xs">{errors.category}</p>
        )}
      </div>

      {/* Age */}
      <div className="space-y-2">
        <Label htmlFor="age">
          Age <span className="text-red-500">*</span>
        </Label>
        <Input
          id="age"
          name="age"
          type="number"
          min="1"
          value={formData.age}
          onChange={handleInputChange}
          placeholder="Enter age of soul won"
          className={cn(errors.age && "border-red-500")}
        />
        {errors.age && <p className="text-red-500 text-xs">{errors.age}</p>}
      </div>

      {/* Residence */}
      <div className="space-y-2">
        <Label htmlFor="residence">
          Residence <span className="text-red-500">*</span>
        </Label>
        <Input
          id="residence"
          name="residence"
          value={formData.residence}
          onChange={handleInputChange}
          placeholder="Enter residence"
          className={cn(errors.residence && "border-red-500")}
        />
        {errors.residence && (
          <p className="text-red-500 text-xs">{errors.residence}</p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          maxLength={10}
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="Enter 10-digit phone number"
          className={cn(errors.phoneNumber && "border-red-500")}
        />
        {errors.phoneNumber && (
          <p className="text-red-500 text-xs">{errors.phoneNumber}</p>
        )}
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label>
          On WhatsApp <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.onWhatsapp}
          onValueChange={(val) => handleRadioChange("onWhatsapp", val)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="whatsapp-yes" />
            <Label htmlFor="whatsapp-yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="whatsapp-no" />
            <Label htmlFor="whatsapp-no">No</Label>
          </div>
        </RadioGroup>
        {errors.onWhatsapp && (
          <p className="text-red-500 text-xs">{errors.onWhatsapp}</p>
        )}
      </div>

      {/* Submit Button */}
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
