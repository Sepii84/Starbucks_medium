import { Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import Link from "next/link";

type SiteInfo = {
  aboutText: string;
  footerDescription: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
};

export function Footer({ siteInfo }: { siteInfo: SiteInfo }) {
  const instagramIsExternal = siteInfo.instagramUrl && siteInfo.instagramUrl !== "#";
  const twitterIsExternal = siteInfo.twitterUrl && siteInfo.twitterUrl !== "#";

  return (
    <footer className="w-full overflow-x-clip bg-surface-dim/70 px-5 pb-32 pt-20 md:px-16 md:pb-12">
      <div className="mx-auto max-w-7xl border-t border-white/5 pt-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-extrabold uppercase text-primary">
              Starbucks Medium
            </h2>
            <p className="max-w-sm text-sm leading-6 text-on-surface-variant">
              {siteInfo.footerDescription}
            </p>
            <div className="flex gap-3">
              {siteInfo.instagramUrl && (
                <Link
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-primary transition hover:border-primary/40"
                  href={siteInfo.instagramUrl}
                  target={instagramIsExternal ? "_blank" : undefined}
                  rel={instagramIsExternal ? "noreferrer" : undefined}
                >
                  <Instagram size={18} />
                </Link>
              )}
              {siteInfo.twitterUrl && (
                <Link
                  aria-label="Twitter"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-primary transition hover:border-primary/40"
                  href={siteInfo.twitterUrl}
                  target={twitterIsExternal ? "_blank" : undefined}
                  rel={twitterIsExternal ? "noreferrer" : undefined}
                >
                  <Twitter size={18} />
                </Link>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-mono text-[11px] font-bold uppercase text-on-surface">
              Useful Links
            </h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li>
                <Link className="hover:text-primary" href="/menu">
                  Menu
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/location">
                  Location
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/login">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 font-mono text-[11px] font-bold uppercase text-on-surface">
              Location
            </h3>
            <div className="space-y-3 text-sm text-on-surface-variant">
              <p className="flex min-w-0 gap-2">
                <MapPin className="mt-0.5 shrink-0 text-primary" size={16} />
                <span className="min-w-0 break-words">{siteInfo.address}</span>
              </p>
              <p>{siteInfo.openingHours}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-mono text-[11px] font-bold uppercase text-on-surface">
              Contact
            </h3>
            <div className="space-y-3 text-sm text-on-surface-variant">
              <p className="flex min-w-0 gap-2">
                <Phone className="mt-0.5 shrink-0 text-primary" size={16} />
                <span className="min-w-0 break-words">{siteInfo.phone}</span>
              </p>
              <p className="flex min-w-0 gap-2">
                <Mail className="mt-0.5 shrink-0 text-primary" size={16} />
                <span className="min-w-0 break-all">{siteInfo.email}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/5 pt-8 font-mono text-[10px] uppercase text-on-surface-variant/70 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Starbucks Medium. All rights reserved.</p>
          <p>Secure ordering, crafted for calm mornings and late nights.</p>
        </div>
      </div>
    </footer>
  );
}
