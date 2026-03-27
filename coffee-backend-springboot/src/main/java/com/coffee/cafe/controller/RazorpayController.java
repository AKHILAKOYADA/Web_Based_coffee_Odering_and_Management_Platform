package com.coffee.cafe.controller;

import com.coffee.cafe.entity.Order;
import com.coffee.cafe.repository.OrderRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class RazorpayController {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/create-order")
    public ResponseEntity<String> createOrder(@RequestBody Map<String, Object> data) {
        try {
            Object amountObj = data.get("amount");
            int amount;
            if (amountObj instanceof Number) {
                amount = ((Number) amountObj).intValue();
            } else {
                amount = Integer.parseInt(amountObj.toString());
            }

            RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount * 100);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_rcptid_" + System.currentTimeMillis());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);

            // Inject key_id into the response so frontend can use it directly
            JSONObject responseJson = new JSONObject(razorpayOrder.toString());
            responseJson.put("key_id", keyId);
            return ResponseEntity.ok(responseJson.toString());

        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body("Razorpay Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal Error: " + e.getMessage());
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<String> verifyPayment(@RequestBody Map<String, Object> data) {
        try {
            String orderId = (String) data.get("razorpay_order_id");
            String paymentId = (String) data.get("razorpay_payment_id");
            String signature = (String) data.get("razorpay_signature");

            // Allow bypass for mock/demo payments
            boolean isMockPayment = "mock_sig".equals(signature);

            boolean isValid = false;
            if (isMockPayment) {
                isValid = true;
            } else {
                JSONObject options = new JSONObject();
                options.put("razorpay_order_id", orderId);
                options.put("razorpay_payment_id", paymentId);
                options.put("razorpay_signature", signature);
                isValid = Utils.verifyPaymentSignature(options, keySecret);
            }

            if (isValid) {
                // Update the order payment status if found in DB
                Order order = orderRepository.findByRazorpayOrderId(orderId).orElse(null);
                if (order != null) {
                    order.setPaymentStatus(Order.PaymentStatus.paid);
                    order.setPaymentId(paymentId);
                    orderRepository.save(order);
                }
                // Return success regardless — payment is valid
                return ResponseEntity.ok("Payment verified successfully");
            } else {
                return ResponseEntity.status(400).body("Invalid payment signature");
            }
        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal Error: " + e.getMessage());
        }
    }
}
