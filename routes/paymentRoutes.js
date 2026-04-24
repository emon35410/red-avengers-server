const express = require('express');
const SSLCommerzPayment = require('sslcommerz-lts');
const router = express.Router();
const { getDB } = require('../config/db'); 
const { verifyToken } = require("../middlewares/authMiddleware");
const { restrictDemoActions } = require("../middlewares/demoMiddleware");

// SSLCommerz Credentials from .env
const store_id = process.env.SSL_STORE_ID;
const store_passwd = process.env.SSL_STORE_PASSWORD;
const is_live = false; // Sandbox mode-- true for live

// payment initialization route
router.post('/init', verifyToken, restrictDemoActions, async (req, res) => {
    const db = getDB();
    const { amount, name, email, phone } = req.body;
    const tran_id = `REF-${Date.now()}`; //unique transaction ID generation

    const data = {
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id,
        // URLs - after payment success, fail, cancel, and IPN (Instant Payment Notification)
        success_url: `${process.env.SERVER_URL}/payments/success/${tran_id}`,
        fail_url: `${process.env.SERVER_URL}/payments/fail/${tran_id}`,
        cancel_url: `${process.env.SERVER_URL}/payments/cancel/${tran_id}`,
        ipn_url: `${process.env.SERVER_URL}/payments/ipn`,
        // Essential/Mandatory Info
        shipping_method: 'No',
        product_name: 'Red Avengers Donation',
        product_category: 'Healthcare',
        product_profile: 'general',
        cus_name: name,
        cus_email: email,
        cus_phone: phone || '01700000000',
        cus_add1: 'Sylhet',
        cus_city: 'Sylhet',
        cus_country: 'Bangladesh',
        // Ship Info (Mandatory placeholder for SSL)
        ship_name: 'N/A',
        ship_add1: 'N/A',
        ship_city: 'N/A',
        ship_state: 'N/A',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    try {
        const apiResponse = await sslcz.init(data);
        if (apiResponse?.GatewayPageURL) {
            // payment reccord in database 
            await db.collection('donations').insertOne({
                name,
                email,
                amount: parseFloat(amount),
                transactionId: tran_id,
                paidStatus: false,
                timestamp: new Date()
            });

            // frontend gateway URL sending
            res.send({ url: apiResponse.GatewayPageURL });
        } else {
            res.status(400).send({ message: "SSLCommerz session failed" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Success Handler
router.post('/success/:tranId', async (req, res) => {
    const db = getDB();
    const { tranId } = req.params;

    // update the transaction record in the database to mark it as paid
    const result = await db.collection('donations').updateOne(
        { transactionId: tranId },
        {
            $set: {
                paidStatus: true,
                paymentDate: new Date(),
                sslDetails: req.body // SSL payment response details for future reference
            }
        }
    );

    if (result.modifiedCount > 0) {
        // success page redirect with transaction ID for reference
        res.redirect(`${process.env.CLIENT_URL}/payments/success/${tranId}`);
    } else {
        res.status(404).send("Transaction Record Not Found");
    }
});

// if payment fails, this route will be hit
router.post('/fail/:tranId', async (req, res) => {
    const db = getDB();
    const { tranId } = req.params;
    await db.collection('donations').deleteOne({ transactionId: tranId });

    res.redirect(`${process.env.CLIENT_URL}/payments/fail/${tranId}`);
});

// if the user cancels the payment, this route will be hit
router.post('/cancel/:tranId', async (req, res) => {
    const db = getDB();
    const { tranId } = req.params;

    try {
        await db.collection('donations').deleteOne({ transactionId: tranId });
        res.redirect(`${process.env.CLIENT_URL}/payments/cancel/${tranId}`);
    } catch (error) {
        res.status(500).send("Error processing cancellation");
    }
});
// instant payment notification (IPN) route - SSLCommerz will hit this URL to notify about payment status
router.post('/ipn', async (req, res) => {
    console.log("IPN Received:", req.body);
    res.send("IPN Acknowledged");
});


router.get('/', verifyToken, restrictDemoActions, async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('donations')
            .find()
            .sort({ timestamp: -1 })
            .toArray();

        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error fetching data", error: error.message });
    }
});



module.exports = router;