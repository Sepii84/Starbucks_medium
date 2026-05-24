import { Footer } from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/auth";
import { getSiteInfo } from "@/lib/data";

type SiteInfo = Awaited<ReturnType<typeof getSiteInfo>>;

export async function PublicPageFrame({
  children,
  siteInfo
}: {
  children: React.ReactNode;
  siteInfo?: SiteInfo;
}) {
  const [resolvedSiteInfo, session] = await Promise.all([
    siteInfo ? Promise.resolve(siteInfo) : getSiteInfo(),
    getSessionUser()
  ]);

  return (
    <>
      <main id="main-content" className="flex-1 pt-20">
        {children}
      </main>
      <Footer siteInfo={resolvedSiteInfo} isLoggedIn={Boolean(session)} />
    </>
  );
}
