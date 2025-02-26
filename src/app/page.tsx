"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  CreditCard,
  CheckCircle,
  MapPinHouse,
  SquareMinus,
  SquarePlus,
  CircleX,
} from "lucide-react";
import Image from "next/image";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe, Elements } from "@stripe/react-stripe-js";

import { stripePromise } from "@/utility/stripe";
import Swal from "sweetalert2";


// Default cart items
const defaultCartItems = [
  { id: 1, title: "rightGLUE", price: 2.71, quantity: 1, thumbnail: "/jglue.png" },
  { id: 2, title: "rightTAPES", price: 5.8, quantity: 1, thumbnail: "/rightTapes.webp" }
];




export default function Checkout() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("");
  const [cartItems, setCartItems] = useState(defaultCartItems);
  const [fullName, setFullName] = useState("");  // Full Name
const [city, setCity] = useState("");  // City
const [state, setState] = useState("");  // State
const [zip, setZip] = useState("");  // ZIP Code
const [country, setCountry] = useState("");  // Country
const [saveAddress, setSaveAddress] = useState(false);  // Save Address Checkbox
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // Stores selected payment method




  // Increase quantity
  const handleIncrease = (id: number) => {
    setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  // Decrease quantity (remove if 0)
  const handleDecrease = (id: number) => {
    setCartItems(cartItems
      .map(item => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter(item => item.quantity > 0)
    );
  };

  // Remove item
  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Calculate prices
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCharge = subtotal < 10 && subtotal > 0 ? 5 : 0;
  
  const total = (subtotal + shippingCharge ).toFixed(2);


// Payment form for Stripe starts here----------------
function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  // Handle card brand detection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCardChange = (event: any) => {
    console.log("Card brand detected:", event.brand);
    setCardBrand(event.brand);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe or Elements are not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get clientSecret from the API
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 20 }), // Change amount as needed
      });

      const { clientSecret, error } = await response.json();

      if (!clientSecret) {
        setError(error || "Failed to fetch client secret.");
        setLoading(false);
        return;
      }

      const cardNumberElement = elements.getElement(CardNumberElement);
      const expiryElement = elements.getElement(CardExpiryElement);
      const cvcElement = elements.getElement(CardCvcElement);

      if (!cardNumberElement) {
        setError("cardNumberElement element not found.");
        setLoading(false);
        return;
      }
      if (!expiryElement) {
        setError("expiryElement element not found.");
        setLoading(false);
        return;
      }
      if (!cvcElement) {
        setError("cvcElement element not found.");
        setLoading(false);
        return;
      }

      // Confirm payment using the client secret
      const { paymentIntent, error: stripeError } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: "Kishan.ta",
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Payment failed.");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess(); // Move to confirmation step
      }
    } catch (err) {
      setError("An error occurred during payment.");
      console.error(err);
    }

    setLoading(false);
  };

  const defaultCardLogo =
    "https://upload.wikimedia.org/wikipedia/commons/2/2a/Credit_card_font_awesome.svg"; // Generic card icon

  // Get card brand logo dynamically
  const getCardBrandLogo = (brand: string | null) => {
    switch (brand) {
      case "visa":
        return "https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg";
      case "mastercard":
        return "https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg";
      case "amex":
        return defaultCardLogo;
      case "discover":
        return defaultCardLogo;
      default:
        return defaultCardLogo;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-auto border border-gray-200">
      <h3 className="text-sm sm:text-lg font-semibold mb-4 text-center">
        Enter Card Details
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div className="p-4 border rounded-lg bg-gray-50 shadow-sm relative">
          <label className="font-medium text-gray-700 mb-2 text-sm sm:text-lg">
            Card Number
          </label>
          <div className="relative">
            <CardNumberElement
              className="p-3 bg-white border rounded-md w-full pr-12"
              options={{
                style: {
                  base: { fontSize: "13px", color: "#333" },
                },
              }}
              onChange={handleCardChange}
            />
            {cardBrand && (
              <Image
                src={getCardBrandLogo(cardBrand) || defaultCardLogo}
                alt={cardBrand || "Card brand logo"}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6"
                width={24}
                height={24}
              />
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p className="font-medium">Test Card Numbers (for Stripe Demo):</p>
            <ul className="list-disc pl-5">
              <li>
                Visa: <span className="font-mono">4242 4242 4242 4242</span>
              </li>
              <li>
                Mastercard:{" "}
                <span className="font-mono">5555 5555 5555 4444</span>
              </li>
              <li>
                Amex: <span className="font-mono">3782 822463 10005</span>
              </li>
              <li>
                Discover: <span className="font-mono">6011 1111 1111 1117</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
          <label className="font-medium text-gray-700 mb-2 text-sm sm:text-lg">
            Expiry Date
          </label>
          <CardExpiryElement
            className="p-3 bg-white border rounded-md w-full"
            options={{
              style: {
                base: { fontSize: "13px", color: "#333" },
              },
            }}
          />

          <div className="mt-2 text-xs text-gray-500">
            <p className="font-medium">
              Please provide a future date (for Stripe Demo):
            </p>
          </div>
        </div>

        {/* CVC */}
        <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
          <label className="font-medium text-gray-700 mb-2 text-sm sm:text-lg">
            CVC
          </label>
          <CardCvcElement
            className="p-3 bg-white border rounded-md w-full"
            options={{
              style: {
                base: { fontSize: "13px", color: "#333" },
              },
            }}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-4">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 sm:text-sm text-xs"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------- payment form ends here==========




  

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl">
        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          {["Cart", "Address", "Payment", "Confirmation"].map((label, index) => (
            <div key={index} className={`flex flex-col items-center ${step > index ? "text-green-600" : "text-gray-400"}`}>
              {index === 0 && <ShoppingCart size={24} />}
              {index === 1 && <MapPinHouse size={24} />}
              {index === 2 && <CreditCard size={24} />}
              {index === 3 && <CheckCircle size={24} />}
              <span className="mt-1 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Checkout Steps */}
        {step === 1 && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <h2 className="text-md sm:text-xl font-semibold">Your Cart</h2>
    
    {cartItems.length === 0 ? (
      <p className="text-gray-600 sm:text-xl font-semibold mb-4">Your cart is empty.</p>
    ) : (
      <div className="space-y-2 sm:space-y-4">
        {cartItems.map(item => (
          <div key={item.id} className="flex items-center justify-between border-b pb-2 sm:space-x-4" style={{ height: "90px" }}>
            {/* Product Image */}
            <Image src={item.thumbnail} alt={item.title} width={60} height={60} className="rounded object-cover sm:block hidden" />

            <div className="flex-1">
              <p className="font-semibold sm:text-sm text-xs">{item.title}</p>
              <p className="text-gray-600 sm:text-sm text-xs sm:mt-0 mt-2">${item.price}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center sm:gap-2">
              <button className="px-2 rounded" onClick={() => handleDecrease(item.id)}>
                <SquareMinus className="sm:size-5 size-4" />
              </button>
              <span className="sm:text-sm font-bold text-xs">{item.quantity}</span>
              <button className="px-2 rounded" onClick={() => handleIncrease(item.id)}>
                <SquarePlus className="sm:size-5 size-4" />
              </button>
            </div>

            {/* Item Price */}
            <div className="sm:ml-4 flex" style={{ minWidth: "80px", justifyContent: "flex-end" }}>
              <p className="font-semibold sm:text-sm text-xs">${(item.price * item.quantity).toFixed(2)}</p>
            </div>

            {/* Remove Item Button */}
            <button className="ml-2" onClick={() => removeItem(item.id)}>
              <CircleX size={20} className="text-red-500" />
            </button>
          </div>
        ))}
      </div>
    )}

    {/* Shipping Charge Notification */}
    {subtotal > 0 && subtotal < 10 && (
      <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md flex items-center gap-2 mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-.01-7.5A8.25 8.25 0 1012 3a8.25 8.25 0 000 16.5z" />
        </svg>
        <span className="font-semibold">Orders below $10 will have a $5 shipping fee.</span>
      </div>
    )}

    {/* Shipping Charge Breakdown */}
    {cartItems.length > 0 && (
      <div className="mt-4 flex justify-between font-semibold text-xl">
        <span>Shipping:</span>
        <span className={shippingCharge > 0 ? "text-red-500" : ""}>
          ${shippingCharge === 0 ? "0" : shippingCharge}
        </span>
      </div>
    )}

    {/* COUPON FUNCTIONALITY (Only when subtotal > 50) */}
    {subtotal > 50 && (
      <div className="mt-4 bg-green-100 text-green-800 p-3 rounded-md flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-.01-7.5A8.25 8.25 0 1012 3a8.25 8.25 0 000 16.5z" />
        </svg>
        <span className="font-semibold">🎉 You are eligible for a coupon! Apply at checkout.</span>
      </div>
    )}

    {/* Total Price */}
    {cartItems.length > 0 && (
      <div className="mt-2 flex justify-between font-semibold text-2xl">
        <span>Total:</span>
        <span>${total}</span>
      </div>
    )}

    {/* Navigation Buttons */}
    <button onClick={() => setStep(2)} className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={cartItems.length === 0}>
      Proceed to Address
    </button>
  </motion.div>
)}





{step === 2 && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Shipping Address</h2>

    {/* Name Input */}
    <div className="mb-4">
      <label className="block text-gray-700 font-medium">Full Name</label>
      <input
        type="text"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Address Input */}
    <div className="mb-4">
      <label className="block text-gray-700 font-medium">Street Address</label>
      <input
        type="text"
        placeholder="Enter your address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* City & State Inputs */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-gray-700 font-medium">City</label>
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium">State</label>
        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    {/* ZIP & Country Inputs */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-gray-700 font-medium">ZIP Code</label>
        <input
          type="text"
          placeholder="ZIP Code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="cursor-pointer">
        <label className="block text-gray-700 font-medium">Country</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">Select Country</option>
          <option value="USA">United States</option>
          <option value="UAE">United Arab Emirates</option>
          <option value="UK">United Kingdom</option>
          <option value="IN">India</option>
          <option value="CA">Canada</option>
        </select>
      </div>
    </div>

    {/* Save Address Checkbox */}
    <div className="mb-4 flex items-center gap-2 cursor-pointer">
      <input type="checkbox" id="saveAddress" checked={saveAddress} onChange={() => setSaveAddress(!saveAddress)} className="cursor-pointer"/>
      <label htmlFor="saveAddress" className="text-gray-700 font-medium">Save this address for future orders</label>
    </div>

    {/* Navigation Buttons */}
    <div className="flex justify-between">
      <button 
        onClick={() => setStep(1)} 
        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all"
      >
        ← Back to Cart
      </button>
      <button 
        onClick={() => setStep(3)} 
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
      >
        Proceed to Payment →
      </button>
    </div>
  </motion.div>
)}


{step === 3 && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <h2 className="sm:text-xl text-sm font-semibold mb-4">Select Payment Method</h2>

    {/* Payment Methods */}
    <div className="space-y-4">
      {/* Cash on Delivery (COD) */}
      <div
        className={`border p-4 rounded-lg cursor-pointer flex items-center gap-4 ${
          selectedPaymentMethod === "COD" ? "border-blue-500 bg-blue-100" : ""
        }`}
        onClick={() => setSelectedPaymentMethod("COD")}
      >
        <input type="radio" checked={selectedPaymentMethod === "COD"} readOnly />
        <span className="font-semibold text-sm sm:text-lg">Cash on Delivery (COD)</span>
      </div>

      {/* Stripe Payment */}
      <div
        className={`border p-4 rounded-lg cursor-pointer flex items-center gap-4 ${
          selectedPaymentMethod === "Stripe" ? "border-blue-500 bg-blue-100" : ""
        }`}
        onClick={() => setSelectedPaymentMethod("Stripe")}
      >
        <input type="radio" checked={selectedPaymentMethod === "Stripe"} readOnly />
        <span className="font-semibold text-sm sm:text-lg">Pay with Card (Stripe)</span>
      </div>
    </div>

    {/* Stripe Payment Form */}
    {selectedPaymentMethod === "Stripe" && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-100">
                  <Elements stripe={stripePromise}>
                    <PaymentForm onSuccess={() => setStep(4)} />
                  </Elements>
                </div>
              )}

    {/* Confirm Payment Button (COD) */}
    {selectedPaymentMethod === "COD" && (
      <button
        onClick={() => {
          Swal.fire({
            title: "Processing Payment...",
            html: "Please do not press back button",
            timer: 4000,
            timerProgressBar: true,
            didOpen: () => Swal.showLoading(),
          }).then(() => setStep(4)); // Transition to Payment Success
        }}
        className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        <span className="text-sm sm:text-lg">Confirm Payment (COD)</span>
      </button>
    )}

    {/* Cancel Button */}
    <button className="mt-4 w-full bg-orange-600 text-white px-4 py-2 rounded-lg"  onClick={() => setStep(1)} >
      <span className="text-sm sm:text-lg">Cancel</span>
    </button>
  </motion.div>
)}


{step === 4 && (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }} 
    animate={{ opacity: 1, scale: 1 }} 
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white -lg rounded-lg p-6 text-center"
  >
    <div className="flex flex-col items-center">
      {/* Success Icon */}
      <div className="bg-green-100 p-4 rounded-full mb-4">
        <svg
          className="w-12 h-12 text-green-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
      <p className="text-gray-500 mt-2">Thank you for your purchase. Your order has been placed successfully.</p>

      {/* Animated Confetti (Optional) */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.3 }}
      >
        🎉 🎊
      </motion.div>

      {/* Back Button */}
      <button 
        onClick={() => setStep(1)} 
        className="mt-6 bg-green-600 hover:bg-green-700 transition text-white font-medium px-6 py-2 rounded-lg w-full shadow-md"
      >
        Continue Shopping
      </button>
    </div>
  </motion.div>
)}

      </div>
    </div>
  );
}
