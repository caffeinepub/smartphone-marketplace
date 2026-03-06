import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../components/ImageUpload";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateListing,
  useListing,
  useUpdateListing,
} from "../hooks/useQueries";

const BRANDS = [
  "Apple",
  "Samsung",
  "Google",
  "OnePlus",
  "Xiaomi",
  "Sony",
  "Infinix",
  "Tecno",
  "QMobile",
  "Itel",
  "Vivo",
  "Oppo",
  "Realme",
  "Nokia",
  "Other",
];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

interface SellPageProps {
  onSuccess: () => void;
  onBack: () => void;
  editId?: string;
}

interface FormState {
  title: string;
  brand: string;
  model: string;
  condition: string;
  price: string;
  description: string;
  frontImageUrl: string;
  backImageUrl: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  brand: "",
  model: "",
  condition: "",
  price: "",
  description: "",
  frontImageUrl: "",
  backImageUrl: "",
};

export function SellPage({ onSuccess, onBack, editId }: SellPageProps) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>> & { frontImageUrl?: string }
  >({});

  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();

  // Load existing listing for edit
  const { data: existingListing } = useListing(editId ?? "");

  useEffect(() => {
    if (editId && existingListing) {
      setForm({
        title: existingListing.title,
        brand: existingListing.brand,
        model: existingListing.model,
        condition: existingListing.condition,
        price: (Number(existingListing.price) / 100).toString(),
        description: existingListing.description,
        frontImageUrl: existingListing.imageUrl,
        backImageUrl: "",
      });
    }
  }, [editId, existingListing]);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.brand) newErrors.brand = "Brand is required";
    if (!form.model.trim()) newErrors.model = "Model is required";
    if (!form.condition) newErrors.condition = "Condition is required";
    if (!form.price || Number(form.price) <= 0)
      newErrors.price = "Enter a valid price";
    if (!form.frontImageUrl)
      newErrors.frontImageUrl = "Please upload a front photo of your phone";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const price = BigInt(Math.round(Number(form.price) * 100));

    try {
      if (editId) {
        await updateMutation.mutateAsync({
          id: editId,
          title: form.title,
          brand: form.brand,
          model: form.model,
          condition: form.condition,
          price,
          description: form.description,
          imageUrl: form.frontImageUrl,
        });
        toast.success("Listing updated!");
      } else {
        await createMutation.mutateAsync({
          title: form.title,
          brand: form.brand,
          model: form.model,
          condition: form.condition,
          price,
          description: form.description,
          imageUrl: form.frontImageUrl,
        });
        toast.success("Listing posted!");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold font-display mb-2">
          Sign in required
        </h2>
        <p className="text-muted-foreground mb-6">
          You need to sign in with Internet Identity to post a listing.
        </p>
        <Button
          data-ocid="sell.login.button"
          onClick={login}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        data-ocid="sell.back.button"
        onClick={onBack}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold font-display mb-1">
          {editId ? "Edit Listing" : "Sell a Phone"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {editId
            ? "Update your listing details."
            : "Fill in the details to list your phone for sale."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          data-ocid="sell.form"
        >
          {/* Image upload */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Phone Photos</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload 2 photos of your phone &mdash; one front and one back.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front image */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    Front <span className="text-destructive">*</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Screen side
                  </span>
                </div>
                <div data-ocid="sell.front_image.dropzone" className="contents">
                  <ImageUpload
                    onUploadComplete={(hash) => {
                      setForm((prev) => ({ ...prev, frontImageUrl: hash }));
                      setErrors((prev) => ({
                        ...prev,
                        frontImageUrl: undefined,
                      }));
                    }}
                    currentImageUrl={form.frontImageUrl}
                    disabled={isPending}
                  />
                </div>
                {errors.frontImageUrl && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="sell.front_image.error_state"
                  >
                    {errors.frontImageUrl}
                  </p>
                )}
              </div>

              {/* Back image */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">Back</span>
                  <span className="text-xs text-muted-foreground">
                    Camera side
                  </span>
                </div>
                <div data-ocid="sell.back_image.dropzone" className="contents">
                  <ImageUpload
                    onUploadComplete={(hash) =>
                      setForm((prev) => ({ ...prev, backImageUrl: hash }))
                    }
                    currentImageUrl={form.backImageUrl}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              data-ocid="sell.title.input"
              placeholder="e.g. iPhone 15 Pro Max 256GB"
              value={form.title}
              onChange={set("title")}
              disabled={isPending}
            />
            {errors.title && (
              <p
                className="text-xs text-destructive"
                data-ocid="sell.title.error_state"
              >
                {errors.title}
              </p>
            )}
          </div>

          {/* Brand + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">
                Brand <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.brand}
                onValueChange={(v) => {
                  setForm((prev) => ({ ...prev, brand: v }));
                  setErrors((prev) => ({ ...prev, brand: undefined }));
                }}
                disabled={isPending}
              >
                <SelectTrigger id="brand" data-ocid="sell.brand.select">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brand && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="sell.brand.error_state"
                >
                  {errors.brand}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">
                Model <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                data-ocid="sell.model.input"
                placeholder="e.g. 15 Pro Max"
                value={form.model}
                onChange={set("model")}
                disabled={isPending}
              />
              {errors.model && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="sell.model.error_state"
                >
                  {errors.model}
                </p>
              )}
            </div>
          </div>

          {/* Condition + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">
                Condition <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.condition}
                onValueChange={(v) => {
                  setForm((prev) => ({ ...prev, condition: v }));
                  setErrors((prev) => ({ ...prev, condition: undefined }));
                }}
                disabled={isPending}
              >
                <SelectTrigger id="condition" data-ocid="sell.condition.select">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condition && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="sell.condition.error_state"
                >
                  {errors.condition}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Price (PKR) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  ₨
                </span>
                <Input
                  id="price"
                  data-ocid="sell.price.input"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="50000"
                  value={form.price}
                  onChange={set("price")}
                  className="pl-8"
                  disabled={isPending}
                />
              </div>
              {errors.price && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="sell.price.error_state"
                >
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-ocid="sell.description.textarea"
              placeholder="Storage capacity, color, accessories included, any defects…"
              rows={4}
              value={form.description}
              onChange={set("description")}
              disabled={isPending}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            data-ocid="sell.submit_button"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editId ? "Saving…" : "Posting…"}
              </>
            ) : editId ? (
              "Save Changes"
            ) : (
              "Post Listing"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
