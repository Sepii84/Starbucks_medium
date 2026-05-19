"use client";

import { useActionState } from "react";
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

  return (
    <form action={action} className="grid gap-5">
      <FormMessage message={state.message} ok={state.ok} />
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
            <input className={inputClasses} id={name} name={name} defaultValue={value} />
            <FieldError messages={state.errors?.[name]} />
          </div>
        ))}
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Saving..." : "Save Website Information"}
      </Button>
    </form>
  );
}
