import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const listingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  category: z.string().min(1, "Select a category"),
  species: z.string().trim().min(2, "Species is required").max(60),
  price: z.coerce.number().positive("Price must be positive"),
  unit: z.string().min(1, "Select a unit"),
  quantity: z.string().trim().min(1, "Quantity is required").max(30),
  weight: z.string().trim().max(30).optional(),
  location: z.string().trim().min(2, "Location is required").max(100),
  description: z.string().trim().max(500).optional(),
  survival_guarantee: z.coerce.number().min(0).max(100).optional(),
});

type ListingValues = z.infer<typeof listingSchema>;

interface AddListingFormProps {
  onClose: () => void;
}

export default function AddListingForm({ onClose }: AddListingFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      category: "",
      species: "",
      price: undefined,
      unit: "",
      quantity: "",
      weight: "",
      location: "",
      description: "",
      survival_guarantee: 0,
    },
  });

  const onSubmit = async (values: ListingValues) => {
    setSubmitting(true);
    // For now, just simulate — marketplace listings table can be added later
    await new Promise((r) => setTimeout(r, 800));
    console.log("New listing:", values);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-card w-full max-w-md rounded-t-3xl shadow-xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-4 pt-4 pb-2 border-b border-border/50">
          <h2 className="text-base font-bold font-display text-foreground">Sell Your Fish</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Listing Title</FormLabel>
                <FormControl><Input placeholder="e.g. Tilapia Fingerlings" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="fingerlings">Fingerlings</SelectItem>
                      <SelectItem value="fry">Fry</SelectItem>
                      <SelectItem value="table-fish">Table Fish</SelectItem>
                      <SelectItem value="broodstock">Broodstock</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="species" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Species</FormLabel>
                  <FormControl><Input placeholder="e.g. Nile Tilapia" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Price</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="per piece">Per piece</SelectItem>
                      <SelectItem value="per kg">Per kg</SelectItem>
                      <SelectItem value="per bag">Per bag</SelectItem>
                      <SelectItem value="per batch">Per batch</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Quantity</FormLabel>
                  <FormControl><Input placeholder="e.g. 5,000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Weight Range</FormLabel>
                  <FormControl><Input placeholder="e.g. 5-8g" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="survival_guarantee" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Survival %</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Location</FormLabel>
                <FormControl><Input placeholder="City, Country" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description (optional)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Additional details..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? "Publishing…" : "Publish Listing"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
