import { HiArrowRight } from "react-icons/hi";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo-2nd";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal-2nd";

const footerNavList = [
    {
        label: "NAVIGATION",
        items: [
            { label: "Account Log-in", href: "/signup" },
            { label: "Schedule a Demo", href: "/schedule-demo" },
            {
                label: "Affiliates",
                href: "#",
                badge: (
                    <Badge color="gray" type="modern" size="sm" className="ml-1">
                        New
                    </Badge>
                ),
            },
        ],
    },
    {
        label: "HOW WE CAN HELP",
        items: [
            { label: "Automation", href: "/pricing" },
            { label: "Business Manager", href: "/pricing" },
        ],
    },
    {
        label: "TALK TO US",
        items: [
            { label: "+1 (313) 217-2212", href: "tel:+13132172212" },
        ],
    },
];

export const FooterLarge01 = () => {
    return (
        <footer className="bg-primary py-8 md:py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mb-6 md:mb-8 text-center md:text-left">
                    <a href="/" className="inline-block hover:opacity-80 transition-opacity">
                        <div className="sm:hidden">
                            <UntitledLogoMinimal className="h-10 w-10 mx-auto" />
                        </div>
                        <div className="hidden sm:block">
                            <UntitledLogo className="h-6 md:h-8 mx-auto md:mx-0" />
                        </div>
                    </a>
                </div>
                <nav>
                    <ul className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 text-center md:text-left">
                        {footerNavList.map((category) => (
                            <li key={category.label}>
                                <Button color="link-gray" size="sm" className="gap-1">{category.label}</Button>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (
                                        <li key={item.label}>
                                            <Button color="link-color" size="sm" href={item.href} iconTrailing={item.badge} className="gap-1">
                                                {item.label}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                        <div className="flex flex-col items-center sm:items-start gap-4 sm:gap-6 md:gap-7">
                            {/* Zoom Meeting box */}
                            <a href="https://uniqueleverage.com/zoom" className="flex items-center gap-2 rounded-xl bg-gray-100 px-2 py-3 shadow-sm transition hover:shadow-md">
                                <img src="/zoom-icon.png" alt="Zoom Logo" className="h-10 w-10 rounded-md" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-gray-900">Zoom Meeting</span>
                                    <span className="flex items-center text-xs text-gray-600">
                                        Join The Zoom Meeting<HiArrowRight />
                                    </span>
                                </div>
                            </a>

                        </div>
                    </ul>
                </nav>
                <div className="mt-8 border-t border-secondary pt-6 md:mt-12 md:pt-8 lg:mt-16">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                        <p className="text-xs md:text-sm text-quaternary text-center md:text-left">© All Rights Reserved 2017-2025 UniqueLeverage LLC.</p>
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6 md:justify-end">
                            <Button color="link-color" size="sm" href="https://uniqueleverage.com/terms-of-service">
                                Terms of Service
                            </Button>
                            <Button color="link-color" size="sm" href="https://uniqueleverage.com/privacy-policy">
                                Privacy Policy
                            </Button>
                            <Button color="link-color" size="sm" href="https://uniqueleverage.com/cookie-policy">
                                Cookies
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
