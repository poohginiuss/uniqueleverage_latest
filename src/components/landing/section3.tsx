import { Avatar } from "@/components/base/avatar/avatar";
import { useState } from "react";
import { StarIcon } from "@/components/foundations/rating-stars";
import { cx } from "@/utils/cx";
 
export const TestimonialCard = () => {
    const [currentReviewIndex] = useState(0);
    return (
        <section className="bg-primary py-4 md:py-8">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <figure className="flex flex-col gap-4 rounded-2xl bg-secondary px-4 py-6 text-center md:gap-6 md:px-8 md:py-10 lg:p-12">
                    <div className="flex flex-col gap-2 items-center">
                        <div aria-hidden="true" className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={`${currentReviewIndex}-${index}`}
                                    className={cx(
                                        "flex size-4 items-center justify-center md:size-5",
                                        index < 4 ? "text-fg-brand-secondary" : "text-fg-brand-secondary_alt",
                                    )}
                                >
                                    <StarIcon />
                                </div>
                            ))}
                        </div>
                        <blockquote className="text-lg font-medium text-primary md:text-xl lg:text-2xl">
                            "Best tool in my dealer group.
                        </blockquote>
                        <blockquote className="text-lg font-medium text-primary md:text-xl lg:text-2xl">
                            Unique Leverage for the win!"
                        </blockquote>
                    </div>
                    <figcaption className="flex justify-center">
                        <div className="flex origin-bottom flex-col items-center gap-3 will-change-transform md:gap-4">
                            <div className="flex gap-3 md:gap-4">
                                <Avatar src="/avatar/1.png" alt="Fleur Cook" size="lg" className="md:size-xl" />
                                <div className="flex flex-col gap-1">
                                    <p className="text-base font-semibold text-primary md:text-lg">Derek Elkins, Owner</p>
                                    <cite className="text-sm text-tertiary not-italic md:text-md">Owner at Green Light Auto</cite>
                                </div>
                            </div>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
};