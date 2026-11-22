import FeatureGrid from "./FeatureGrid";

export default function OtherPages({ current }: { current: string }) {
  return (
    <section className="mt-16 border-t border-line pt-8" aria-labelledby="other-title">
      <h2 id="other-title" className="text-xl font-bold">
        আরও দেখুন
      </h2>
      <div className="mt-4">
        <FeatureGrid exclude={current} compact />
      </div>
    </section>
  );
}