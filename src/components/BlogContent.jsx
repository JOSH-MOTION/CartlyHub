import Link from "next/link";

/** Renders `[text](/path)` as a real Link, leaves everything else as plain text. */
const renderInline = (text) => {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return <span key={index}>{part}</span>;
    return (
      <Link key={index} href={match[2]} className="text-black underline decoration-2 underline-offset-2 hover:text-emerald-600">
        {match[1]}
      </Link>
    );
  });
};

export default function BlogContent({ blocks }) {
  return (
    <div className="space-y-6 text-gray-700 text-[15px] leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="text-xl font-black uppercase tracking-tight text-black pt-4">
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc pl-5 space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}
