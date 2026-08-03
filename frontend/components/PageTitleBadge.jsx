// Page-top section title, styled like the mission nav's "Retour"
// buttons (blue background, yellow text) with the same icon shown for
// this section in the bottom nav — so the section you're in reads the
// same way whether you're looking at the bottom nav or the page top.
export default function PageTitleBadge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-yellow-300">
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}
