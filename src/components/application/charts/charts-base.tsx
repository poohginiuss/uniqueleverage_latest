import React from 'react';

export const ChartTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-secondary bg-primary p-3 shadow-lg">
                <p className="text-sm font-medium text-primary">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm text-tertiary" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const selectEvenlySpacedItems = (data: any[], count: number) => {
    if (data.length <= count) {
        return data;
    }
    
    const step = Math.floor(data.length / count);
    const result = [];
    
    for (let i = 0; i < count; i++) {
        const index = Math.min(i * step, data.length - 1);
        result.push(data[index]);
    }
    
    return result;
};
