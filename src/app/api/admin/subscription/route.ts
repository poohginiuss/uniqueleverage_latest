import { NextRequest, NextResponse } from 'next/server';

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

export async function POST(request: NextRequest) {
    if (!stripe) {
        return NextResponse.json(
            { success: false, error: 'Stripe not configured' },
            { status: 500 }
        );
    }

    try {
        const { action, customerId, subscriptionId } = await request.json();

        if (!customerId || !action) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case 'cancel':
                if (!subscriptionId) {
                    return NextResponse.json(
                        { success: false, error: 'Subscription ID required for cancellation' },
                        { status: 400 }
                    );
                }
                
                // Cancel the subscription immediately
                result = await stripe.subscriptions.cancel(subscriptionId);
                break;

            case 'reactivate':
                if (!subscriptionId) {
                    return NextResponse.json(
                        { success: false, error: 'Subscription ID required for reactivation' },
                        { status: 400 }
                    );
                }
                
                // Reactivate a canceled subscription
                result = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: false,
                });
                break;

            case 'pause':
                if (!subscriptionId) {
                    return NextResponse.json(
                        { success: false, error: 'Subscription ID required for pause' },
                        { status: 400 }
                    );
                }
                
                // Pause the subscription
                result = await stripe.subscriptions.update(subscriptionId, {
                    pause_collection: {
                        behavior: 'void',
                    },
                });
                break;

            case 'resume':
                if (!subscriptionId) {
                    return NextResponse.json(
                        { success: false, error: 'Subscription ID required for resume' },
                        { status: 400 }
                    );
                }
                
                // Resume a paused subscription
                result = await stripe.subscriptions.update(subscriptionId, {
                    pause_collection: null,
                });
                break;

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }


        return NextResponse.json({
            success: true,
            subscription: {
                id: result.id,
                status: result.status,
                current_period_end: result.current_period_end,
                cancel_at_period_end: result.cancel_at_period_end,
                pause_collection: result.pause_collection,
            }
        });

    } catch (error: any) {
        console.error('Stripe subscription management error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to manage subscription' },
            { status: 500 }
        );
    }
}
