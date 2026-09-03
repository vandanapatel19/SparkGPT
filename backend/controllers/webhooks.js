// import Stripe from 'stripe';
// import Transaction from '../models/Transaction.js';
// import User from '../models/User.js';

// export const stripeWebHooks = async (req, res) => {
//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//     const sig = req.headers["stripe-signature"];

//     let event;
//     try {
//         event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//     } catch (error) {
//         return res.status(400).send(`Webhook Error: ${error.message}`);
//     }

//     try {
//         switch (event.type) {
//             case "payment_intent.succeeded": {
//                 const paymentIntent = event.data.object;
//                 const sessionList = await stripe.checkout.sessions.list({
//                     payment_intent: paymentIntent.id,
//                 })

//                 const session = sessionList.data[0];
//                 const { transactionId, appId } = session.metadata;

//                 if (appId === 'sparkgpt') {
//                     const transaction = await Transaction.findOne({ _id: transactionId, isPaid: false })

//                     //update credits in user model
//                     await User.updateOne({ _id: transaction.userId }, { $inc: { credits: transaction.credits } })

//                     //update credit payment status
//                     transaction.isPaid = true;
//                     await transaction.save();
//                 } else {
//                     return res.json({ received: true, message: "Ignored event:Invalid app" })
//                 }
//                 break;
//             }

//             default:
//                 console.log("Unhandled event type:", event.type)
//                 break;
//         }
//     } catch (error){

//         console.log('Webhook processing error', error);
//         return res.status(500).send('Internal Server error');
//     }
//     }


import Stripe from 'stripe';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export const stripeWebHooks = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;

    // 1. Verify Stripe webhook signature
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('Stripe webhook received');
        console.log('Event type:', event.type);

    } catch (error) {
        console.log('Webhook signature error:', error.message);

        return res.status(400).send(
            `Webhook Error: ${error.message}`
        );
    }

    // 2. Process event
    try {

        switch (event.type) {

            case 'checkout.session.completed': {

                const session = event.data.object;

                console.log(
                    'Checkout session completed:',
                    session.id
                );

                const {
                    transactionId,
                    appId
                } = session.metadata || {};

                console.log(
                    'Transaction ID:',
                    transactionId
                );

                console.log(
                    'App ID:',
                    appId
                );

                if (appId !== 'sparkgpt') {
                    console.log('Ignored event: Invalid app');
                    return res.json({
                        received: true,
                        message: 'Ignored event: Invalid app'
                    });
                }

                if (!transactionId) {
                    console.log('Transaction ID missing');
                    return res.json({
                        received: true,
                        message: 'Transaction ID missing'
                    });
                }

                const transaction = await Transaction.findOne({
                    _id: transactionId
                });

                if (!transaction) {
                    console.log('Transaction not found:', transactionId);
                    return res.status(404).json({
                        received: true,
                        message: 'Transaction not found'
                    });
                }

                if (transaction.isPaid) {
                    console.log('Transaction already paid:', transactionId);
                    return res.json({
                        received: true,
                        message: 'Transaction already processed'
                    });
                }

                const user = await User.findById(transaction.userId);

                if (!user) {
                    console.log('User not found:', transaction.userId);
                    return res.status(404).json({
                        received: true,
                        message: 'User not found'
                    });
                }

                user.credits += transaction.credits;
                await user.save();

                console.log(`Added ${transaction.credits} credits to user ${user._id}`);

                transaction.isPaid = true;
                await transaction.save();

                console.log('Transaction marked as paid:', transaction._id);
                console.log('Payment successfully processed');

                break;
            }

            default:

                console.log(
                    'Unhandled event type:',
                    event.type
                );

                break;
        }

        // 13. Tell Stripe webhook was received
        return res.json({
            received: true
        });

    } catch (error) {

        console.log(
            'Webhook processing error:',
            error
        );

        return res.status(500).json({
            received: false,
            message: 'Internal Server Error'
        });
    }
};