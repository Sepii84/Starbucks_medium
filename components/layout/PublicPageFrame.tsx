import { Footer } from "@/components/layout/Footer";
import { getSiteInfo } from "@/lib/data";

type SiteInfo = Awaited<ReturnType<typeof getSiteInfo>>;

export async function PublicPageFrame({
  children,
  siteInfo
}: {
  children: React.ReactNode;
  siteInfo?: SiteInfo;
}) {
  const resolvedSiteInfo = siteInfo ?? (await getSiteInfo());

  return (
    <>
      <main id="main-content" className="flex-1 pt-20">
        {children}
      </main>
      <Footer siteInfo={resolvedSiteInfo} />
    </>
  );
}
