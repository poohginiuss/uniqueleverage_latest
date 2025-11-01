"use client";

import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { SystemTheme } from "@/providers/system-theme";
import { ULIntroPageClone } from "@/components/landing/docs/intro-content-test-clone";

export default function TestDocsClonePage() {
  return (
    <SystemTheme>
      <div className="flex flex-col lg:flex-row">
        <SidebarNavigationSimple
          activeUrl="/test"
          items={[
            {
              label: "Getting started",
              href: "/",
              items: [
                { label: "Introduction", href: "/test" },
                { label: "Request Feed", href: "/docs/request-feeds" },
              ],
            },
            {
              label: "Partners",
              href: "/projects",
              items: [
                { label: "Integrations", href: "/docs/integrations" },
              ],
            },
          ]}
        />
        <main className="min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 pb-12 shadow-none lg:bg-primary dark:lg:bg-gray-950 page-transition content-area">
          <header className="max-lg:hidden sticky top-0 z-50 ">
            <section className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700">
              <Breadcrumbs type="button">
                <Breadcrumbs.Item href="#">Docs</Breadcrumbs.Item>
                <Breadcrumbs.Item href="#">Getting started</Breadcrumbs.Item>
                <Breadcrumbs.Item href="#">Introduction</Breadcrumbs.Item>
              </Breadcrumbs>
            </section>
          </header>
          <ULIntroPageClone />
        </main>
      </div>
    </SystemTheme>
  );
}


