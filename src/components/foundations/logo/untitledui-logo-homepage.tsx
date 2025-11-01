"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";
import { UntitledLogoMinimal } from "./untitledui-logo-minimal-2nd";

export const UntitledLogo = (props: HTMLAttributes<HTMLOrSVGElement>) => {
    return (
        <div {...props} className={cx("flex items-center justify-start overflow-visible h-7 w-max", props.className)}>
            {/* Minimal logo */}
            <UntitledLogoMinimal className="size-10" />

            {/* Gap that adjusts to the height of the container */}
            {/* <div className="aspect-[0.3] h-full" /> */}
            
            {/* Logomark - homepage uses new logo */}
            <img
                src="/icon-sets/sidebar-logo-dark.svg"
                alt="Unique Leverage"
                className="h-5 w-auto pl-1 shrink-0"
                draggable={false}
            />
        </div>
    );
};
