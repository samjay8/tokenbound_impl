"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AnalyticsPageView from "@/components/AnalyticsPageView";
import Header from "@/components/Header";
import { useWallet } from "@/contexts/WalletContext";
import { createEvent } from "@/lib/soroban";

export default function CreateEventPage() {
  const router = useRouter();
  const { address, isConnected, isInstalled, connect } = useWallet();

  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [tickets, setTickets] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    const errs: { [key: string]: string } = {};
    const now = Date.now();

    if (!theme.trim()) errs.theme = "Event name required";
    if (!startDate) errs.startDate = "Start date is required";
    if (!endDate) errs.endDate = "End date is required";
    if (startDate && new Date(startDate).getTime() <= now)
      errs.startDate = "Start date must be in the future";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate))
      errs.endDate = "End date must be after start date";
    if (!price) errs.price = "Price required";
    if (price && isNaN(Number(price))) errs.price = "Price must be a number";
    if (price && Number(price) < 0) errs.price = "Price cannot be negative";
    if (!tickets) errs.tickets = "Total tickets required";
    if (tickets && (!/^[0-9]+$/.test(tickets) || Number(tickets) <= 0))
      errs.tickets = "Must be a positive integer";

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let organizerAddress = address;

    if (!address) {
      if (isInstalled) {
        await connect();
        organizerAddress = localStorage.getItem("wallet_address");
      } else {
        alert("Please install Freighter to create an event.");
        return;
      }
    }

    if (!organizerAddress) {
      setErrorMsg("Connect your wallet before creating an event.");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const organizer = organizerAddress;
      const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
      const endUnix = Math.floor(new Date(endDate).getTime() / 1000);
      const ticketPrice = BigInt(Math.floor(parseFloat(price) * 1_000_000));
      const totalTickets = BigInt(tickets);

      // for simplicity we use zero address as payment token; replace with real
      // token contract address or allow user selection later.
      const paymentToken = "0000000000000000000000000000000000000000000000000000000000000000";

      const res = await createEvent({
        organizer,
        theme,
        eventType: description,
        startTimeUnix: startUnix,
        endTimeUnix: endUnix,
        ticketPrice,
        totalTickets,
        paymentToken,
      });

      console.log("transaction result", res);
      setSuccessMsg("Event created (tx " + res.hash + ")");
      // Optionally redirect to dashboard or home after creation
      setTimeout(() => router.push("/"), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#18181B] text-white">
      <AnalyticsPageView page="create-event" />
      <Header />

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-36 sm:px-6">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20">
          <h1 className="mb-2 text-3xl font-bold">Create Event</h1>
          <p className="mb-6 text-zinc-300">
            Launch a new CrowdPass experience with on-chain pricing, inventory, and
            organizer ownership.
          </p>

          {successMsg && (
            <div className="mb-4 rounded-2xl bg-green-500/15 p-3 text-green-200">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-2xl bg-red-500/15 p-3 text-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Event Name
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 shadow-sm"
          />
          {errors.theme && (
            <p className="text-red-600 text-sm">{errors.theme}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 shadow-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">
            Start Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 shadow-sm"
          />
          {errors.startDate && (
            <p className="text-red-600 text-sm">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">
            End Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 shadow-sm"
          />
          {errors.endDate && (
            <p className="text-red-600 text-sm">{errors.endDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">
            Ticket Price (XLM)
          </label>
          <input
            type="number"
            step="0.000001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 shadow-sm"
          />
          {errors.price && (
            <p className="text-red-600 text-sm">{errors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">
            Total Tickets
          </label>
          <input
            type="number"
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
            className="mt-1 block w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 shadow-sm"
          />
          {errors.tickets && (
            <p className="text-red-600 text-sm">{errors.tickets}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200">
            Event Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[#FF5722] px-4 py-3 text-white transition hover:bg-[#F4511E] disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
          </form>
        </div>
      </div>
    </div>
  );
}
