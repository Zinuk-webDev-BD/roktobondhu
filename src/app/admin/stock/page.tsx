import StockManager from "@/components/StockManager";

export const metadata = { title: "ব্যাগ ব্যবস্থাপনা | রক্তবন্ধু" };

export default function AdminStockPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">ব্যাগ ব্যবস্থাপনা</h1>
      <p className="mt-2 max-w-2xl text-slate">
        নতুন ব্যাগ যোগ করুন, গ্রুপ বা অবস্থা অনুযায়ী খুঁজুন এবং মেয়াদ দেখে সাজান।
      </p>
      <StockManager />
    </>
  );
}