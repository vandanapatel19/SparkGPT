import Transaction from "../models/Transaction.js";
import Stripe from 'stripe'

const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
    }
];

//API controller for getting all plans
export const getPlans = async (req, res) => {
    try {
        res.json({ success: true, plans })

    } catch (error) {
        res.json({ success: false, message: error.message })

    }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const verifyCheckoutSession = async (req, res) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ success: false, message: "Missing session_id" });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return res.json({ success: false, message: 'Payment not complete yet' });
        }

        const transactionId = session.metadata?.transactionId;
        if (!transactionId) {
            return res.status(400).json({ success: false, message: 'Missing transaction metadata' });
        }

        const transaction = await Transaction.findOne({ _id: transactionId });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (transaction.isPaid) {
            return res.json({ success: true, message: 'Credits already added', alreadyProcessed: true });
        }

        const user = await User.findById(transaction.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.credits += transaction.credits;
        await user.save();

        transaction.isPaid = true;
        await transaction.save();

        return res.json({ success: true, message: 'Credits added successfully', credits: user.credits });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//API Controller for purchasing plan
export const purchasePlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user._id;
        const plan = plans.find(plan => plan._id === planId);

        if (!plan) {
            return res.status(400).json({ success: false, message: "Invalid plan" });
        }

        //create new transaction
        const transaction = await Transaction.create({
            userId: userId,
            planId: plan._id,
            credits: plan.credits,
            amount: plan.price,
            isPaid: false
        });

        const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: plan.price * 100,
                        product_data: {
                            name: plan.name
                        }
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/loading?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/credits`,
            metadata: { transactionId: transaction._id.toString(), appId: 'sparkgpt' },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

        });

        return res.json({ success: true, url: session.url });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}