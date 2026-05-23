"use client";

import { Pencil, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateSiteInfoAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

type SiteInfoFormData = {
  aboutText: string;
  footerDescription: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  mapUrl?: string | null;
};

export function AdminSiteInfoForm({ siteInfo }: { siteInfo: SiteInfoFormData }) {
  const [state, action, pending] = useActionState(updateSiteInfoAction, emptyActionState);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      setIsEditing(false);
    }
  }, [state.ok]);

  function cancelEdit() {
    formRef.current?.reset();
    setIsEditing(false);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        if (!isEditing) {
          event.preventDefault();
        }
      }}
      className="grid gap-5"
    >
      <FormMessage message={state.message} ok={state.ok} />
      <div className="flex justify-end">
        {!isEditing ? (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 font-mono text-[11px] font-bold uppercase text-primary transition hover:bg-primary/15"
            onClick={() => setIsEditing(true)}
            aria-label="Edit site information"
          >
            <Pencil size={14} />
            Edit
          </button>
        ) : (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[11px] font-bold uppercase text-on-surface-variant transition hover:text-primary"
            onClick={cancelEdit}
          >
            <X size={14} />
            Cancel
          </button>
        )}
      </div>
      <div>
        <label className={labelClasses} htmlFor="aboutText">
          About us text
        </label>
        <textarea
          className={inputClasses}
          id="aboutText"
          name="aboutText"
          rows={6}
          defaultValue={siteInfo.aboutText}
          readOnly={!isEditing}
        />
        <FieldError messages={state.errors?.aboutText} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="footerDescription">
          Footer description
        </label>
        <textarea
          className={inputClasses}
          id="footerDescription"
          name="footerDescription"
          rows={3}
          defaultValue={siteInfo.footerDescription}
          readOnly={!isEditing}
        />
        <FieldError messages={state.errors?.footerDescription} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {[
          ["address", "Address", siteInfo.address],
          ["phone", "Phone", siteInfo.phone],
          ["email", "Email", siteInfo.email],
          ["openingHours", "Opening hours", siteInfo.openingHours],
          ["instagramUrl", "Instagram URL", siteInfo.instagramUrl ?? ""],
          ["twitterUrl", "X/Twitter URL", siteInfo.twitterUrl ?? ""],
          ["mapUrl", "Map URL", siteInfo.mapUrl ?? ""]
        ].map(([name, label, value]) => (
          <div key={name}>
            <label className={labelClasses} htmlFor={name}>
              {label}
            </label>
            <input
              className={inputClasses}
              id={name}
              name={name}
              defaultValue={value}
              readOnly={!isEditing}
            />
            <FieldError messages={state.errors?.[name]} />
          </div>
        ))}
      </div>
      {isEditing && (
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save Website Information"}
        </Button>
      )}
    </form>
  );
}
