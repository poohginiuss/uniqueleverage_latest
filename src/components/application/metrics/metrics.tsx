"use client";

import React from "react";
import { cx } from "@/utils/cx";

interface MetricsChart01Props {
    title: string;
    subtitle: string;
    change?: string;
    trend?: "positive" | "negative";
    chartData?: number[];
    className?: string;
}

export const MetricsChart01: React.FC<MetricsChart01Props> = ({
    title,
    subtitle,
    change,
    trend = "positive",
    chartData,
    className,
}) => {
    const changeColor = trend === "positive" ? "text-success-primary" : "text-error-primary";
    const changeIcon = trend === "positive" ? "↑" : "↓";

    return (
        <div className={cx(
            "flex flex-col gap-3 rounded-xl bg-primary px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset",
            className
        )}>
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <p className="text-2xl font-semibold text-primary">{title}</p>
                    <p className="text-sm text-tertiary">{subtitle}</p>
                </div>
                {change && (
                    <div className={cx("flex items-center gap-1 text-sm font-medium", changeColor)}>
                        <span>{changeIcon}</span>
                        <span>{change}</span>
                    </div>
                )}
            </div>
            
            {/* Simple line chart visualization */}
            {chartData && chartData.length > 0 && (
                <div className="flex h-8 items-end justify-between gap-1">
                    {chartData.slice(-12).map((value, index) => (
                        <div
                            key={index}
                            className="flex-1 bg-utility-brand-500 rounded-sm opacity-60"
                            style={{
                                height: `${Math.max(4, (value / Math.max(...chartData)) * 100)}%`,
                                minHeight: "2px"
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
